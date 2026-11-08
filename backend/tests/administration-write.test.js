const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAdministrationWriteService } = require('../src/modules/administration/administration-write.service');
const { staffInput, accountPatch } = require('../src/modules/administration/administration-write.validation');
const actor = { account_id: '1', staff_id: '2', role_id: '3', permissions: ['manage_users', 'manage_clinical'] };
function fixture({ outside = false, target = true, targetPermissions = ['manage_clinical'], selectedPermissions = ['manage_clinical'], actorPermissions = actor.permissions, fail = '' } = {}) {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (fail && sql.includes(fail)) throw Object.assign(new Error('synthetic secret'), { code: '23503' });
      if (sql.includes('FOR SHARE OF a, nv')) return { rows: [{ account_id: '1', person_id: '2', role_id: '3', branch_id: '9' }] };
      if (sql.startsWith('SELECT ma_vai_tro')) return { rows: [{ id: values[0] }] };
      if (sql.startsWith('SELECT q.ma_quyen_han')) return { rows: (values[0] === '3' ? actorPermissions : targetPermissions).map((name, i) => ({ id: String(i + 10), name })) };
      if (sql.includes('FOR UPDATE OF a')) { assert.deepEqual(values, ['4', '9']); return { rows: target ? [{ account_id: '4', person_id: '5', role_id: '6' }] : [] }; }
      if (sql.includes('AS outside_scope')) return { rows: [{ outside_scope: outside }] };
      if (sql.startsWith('SELECT ma_quyen_han')) return { rows: selectedPermissions.map((name, i) => ({ id: String(i + 10), name })) };
      if (sql.startsWith('INSERT INTO public.nguoi')) return { rows: [{ id: '22' }] };
      if (sql.startsWith('INSERT INTO public.taikhoan')) return { rows: [{ account_id: '33' }] };
      if (sql.startsWith('INSERT INTO public.vaitro ')) return { rows: [{ role_id: '44' }] };
      return { rows: [] };
    },
    release() { calls.push({ sql: 'release' }); },
  };
  const pool = { async connect() { return client; }, query() { assert.fail('must use acquired client'); } };
  return { calls, service: createAdministrationWriteService(pool, { hashPassword: async () => '$2b$12$synthetic-hash-never-returned' }) };
}
const changed = (db) => db.calls.filter(({ sql }) => /^(INSERT|UPDATE|DELETE)/.test(sql));
test('staff validation rejects identity injection, phone/hash mistakes and bcrypt truncation', () => {
  const valid = { username: 'synthetic', password: 'synthetic-password', full_name: 'Synthetic Staff', phone: '0000000000', role_id: '6' };
  for (const body of [{ ...valid, branch_id: '99' }, { ...valid, password: 'short' }, { ...valid, password: 'é'.repeat(37) }, { ...valid, phone: 'abc' }, { ...valid, role_id: 6 }]) assert.throws(() => staffInput(body));
  assert.throws(() => accountPatch({ password_hash: 'synthetic' }));
  assert.throws(() => accountPatch({ is_active: 1 }));
});
test('staff creation derives branch and writes person/staff/account atomically without leaking hash', async () => {
  const db = fixture();
  const result = await db.service.createStaff(actor, { username: 'synthetic', password: 'synthetic-password', full_name: 'Synthetic Staff', phone: '0000000000', role_id: '6' });
  assert.deepEqual(result, { account_id: '33', person_id: '22' });
  assert.deepEqual(changed(db)[1].values, ['22', '9']);
  assert.match(changed(db)[2].values[3], /^\$2b\$12\$/);
  assert.doesNotMatch(JSON.stringify(result), /password|hash|synthetic/);
  assert.equal(db.calls.at(-2).sql, 'COMMIT');
});
test('staff creation cannot grant a role with permissions the administrator lacks', async () => {
  const db = fixture({ targetPermissions: ['unheld-permission'] });
  await assert.rejects(db.service.createStaff(actor, { username: 'synthetic', password: 'synthetic-password', full_name: 'Synthetic Staff', phone: '0000000000', role_id: '6' }), (error) => error.status === 403);
  assert.equal(changed(db).length, 0);
});
test('account updates lock targets within actor branch and reject absent/cross-branch staff', async () => {
  const db = fixture();
  assert.deepEqual(await db.service.updateAccount(actor, '4', { full_name: 'Synthetic Updated', is_active: false }), { account_id: '4' });
  assert.equal(changed(db).length, 2);
  assert.ok(changed(db).every(({ sql }) => !sql.includes('Synthetic Updated')));
  const wrong = fixture({ target: false });
  await assert.rejects(wrong.service.updateAccount(actor, '4', { is_active: false }), (error) => error.status === 404);
  assert.equal(changed(wrong).length, 0);
});
test('self role/activity changes, patient-only identities and stale revoked privileges fail closed', async () => {
  for (const body of [{ role_id: '6' }, { is_active: false }, { is_active: true }]) {
    const db = fixture(); await assert.rejects(db.service.updateAccount(actor, '1', body), (error) => error.status === 403); assert.equal(changed(db).length, 0);
  }
  const db = fixture({ actorPermissions: ['manage_users'] });
  await assert.rejects(db.service.updateAccount(actor, '4', { is_active: false }), (error) => error.status === 403); assert.equal(changed(db).length, 0);
  await assert.rejects(fixture().service.updateAccount({ account_id: '1', patient_id: '2' }, '4', { is_active: false }), (error) => error.status === 403);
});
test('role permission replacement locks role, enforces branch/privilege scope and records grantor', async () => {
  const db = fixture(); assert.deepEqual(await db.service.replacePermissions(actor, '6', { permission_ids: ['10'] }), { role_id: '6' });
  assert.ok(db.calls.some(({ sql, values }) => sql.includes('FOR UPDATE') && values[0] === '6'));
  assert.match(changed(db)[0].sql, /DELETE FROM public.vaitroquyenhan WHERE ma_vai_tro = \$1/);
  assert.deepEqual(changed(db)[1].values, ['6', '10', '2']);
  for (const options of [{ outside: true }, { targetPermissions: ['unheld-permission'] }, { selectedPermissions: ['unheld-permission'] }]) {
    const other = fixture(options); await assert.rejects(other.service.replacePermissions(actor, '6', { permission_ids: ['10'] }), (error) => error.status === 403); assert.equal(changed(other).length, 0);
  }
  await assert.rejects(fixture().service.replacePermissions(actor, '3', { permission_ids: [] }), (error) => error.status === 403);
  await assert.rejects(fixture().service.replacePermissions(actor, '6', { permission_ids: ['10', '10'] }), (error) => error.status === 400);
});
test('new roles initially have no permissions and failures always roll back', async () => {
  const db = fixture(); assert.deepEqual(await db.service.createRole(actor, { ten_vai_tro: 'synthetic', ten_hien_thi: 'Synthetic' }), { role_id: '44' }); assert.equal(changed(db).length, 1);
  const failed = fixture({ fail: 'INSERT INTO public.taikhoan' });
  await assert.rejects(failed.service.createStaff(actor, { username: 'synthetic', password: 'synthetic-password', full_name: 'Synthetic Staff', phone: '0000000000', role_id: '6' }), (error) => error.status === 400);
  assert.equal(failed.calls.at(-2).sql, 'ROLLBACK');
});
