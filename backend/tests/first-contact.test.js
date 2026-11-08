const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFirstContactService } = require('../src/modules/clinical/first-contact.service');
const { createPrincipalLimiter } = require('../src/shared/rate-limit');
const { once } = require('node:events');
const { createApp } = require('../src/app/app');
const doctor = { staff_id: '7', account_id: '1' }, contact = { username: 'synthetic-patient', phone: '0000000000' };
const input = { ...contact, record: { loai_benh_an: 'CAP' }, visit: { ngay_kham: '2026-11-07', ma_phong_kham: '3' } };
function fixture({ candidate = true, occupied = false, room = true, failCommit = false } = {}) {
  const calls = []; let tail = Promise.resolve(), received = occupied, committed = 0;
  const pool = {
    async query(sql, values) { calls.push({ sql, values }); assert.match(sql, /lower\(a.ten_dang_nhap\) = lower\(\$1\) AND n.so_dien_thoai = \$2/); assert.match(sql, /NOT EXISTS/); assert.deepEqual(values, [contact.username, contact.phone, '4']); return { rows: candidate && !received ? [{ patient_id: '11', full_name: 'Synthetic Patient', birth_date: null, gender: null }] : [] }; },
    async connect() {
      let unlock, staged = false;
      const client = {
        async query(sql, values) {
          calls.push({ sql, values, client });
          if (sql.includes('FOR UPDATE OF p')) { const before = tail; tail = new Promise((resolve) => { unlock = resolve; }); await before; assert.deepEqual(values, ['11', contact.username, contact.phone, '4']); assert.match(sql, /FOR SHARE OF a, n/); return { rows: candidate ? [{ patient_id: '11' }] : [] }; }
          if (sql.startsWith('SELECT EXISTS')) return { rows: [{ occupied: received }] };
          if (sql.startsWith('SELECT ma_chi_nhanh')) return { rows: [{ branch_id: '9' }] };
          if (sql.startsWith('SELECT ma_phong_kham')) return { rows: room ? [{ id: '3' }] : [] };
          if (sql.startsWith('INSERT INTO public.hosobenhan')) { staged = true; return { rows: [{ record_id: '21', status: 'draft' }] }; }
          if (sql.startsWith('INSERT INTO public.phienkham\n')) return { rows: [{ visit_id: '22' }] };
          if (sql === 'COMMIT') { if (failCommit) throw Object.assign(new Error('synthetic private COMMIT'), { code: '23503' }); if (staged) { received = true; committed++; } }
          return { rows: [] };
        }, release() { calls.push({ sql: 'release', client }); if (unlock) unlock(); },
      }; return client;
    },
  };
  return { calls, pool, service: createFirstContactService(pool, '4'), committed: () => committed };
}
test('first-contact lookup is an exact-match bounded minimum-identity query, not a patient directory', async () => {
  const db = fixture(); assert.deepEqual(await db.service.lookup(doctor, contact), { patient_id: '11', full_name: 'Synthetic Patient', birth_date: null, gender: null });
  assert.equal(db.calls.length, 1); assert.doesNotMatch(db.calls[0].sql, /ILIKE|password_hash|mat_khau_ma_hoa/); assert.match(db.calls[0].sql, /LIMIT 1/);
  for (const bad of [{ username: contact.username, phone: '000' }, { ...contact, patient_id: '12' }]) await assert.rejects(db.service.lookup(doctor, bad), (error) => error.status === 400);
  await assert.rejects(db.service.lookup({ patient_id: '11' }, contact), (error) => error.status === 403);
  for (const options of [{ candidate: false }, { occupied: true }]) await assert.rejects(fixture(options).service.lookup(doctor, contact), (error) => error.status === 404);
});
test('first intake uses explicit READ COMMITTED, locks identity before fresh occupancy check and derives doctor', async () => {
  const db = fixture(), result = await db.service.intake(doctor, '11', input);
  assert.deepEqual(result, { patient_id: '11', record_id: '21', visit_id: '22', status: 'draft' });
  assert.equal(db.calls[0].sql, 'BEGIN ISOLATION LEVEL READ COMMITTED');
  const lock = db.calls.findIndex(({ sql }) => sql.includes('FOR UPDATE OF p')), check = db.calls.findIndex(({ sql }) => sql.startsWith('SELECT EXISTS'));
  assert.ok(check > lock); assert.ok(db.calls.findIndex(({ sql }) => sql.startsWith('INSERT')) > check);
  const visit = db.calls.find(({ sql }) => sql.startsWith('INSERT INTO public.phienkham\n')); assert.equal(visit.values[1], doctor.staff_id);
  assert.ok(!db.calls.some(({ sql }) => /INSERT INTO public\.(nguoi|benhnhan|taikhoan)\b/.test(sql))); assert.equal(db.committed(), 1);
});
test('competing doctors can accept first contact only once under the queued patient lock', async () => {
  const db = fixture(); const results = await Promise.allSettled([db.service.intake(doctor, '11', input), db.service.intake({ staff_id: '8', account_id: '2' }, '11', input)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1); assert.equal(results.find((result) => result.status === 'rejected').reason.status, 409); assert.equal(db.committed(), 1);
});
test('wrong identity, existing record, wrong branch and COMMIT failure cannot claim a first intake', async () => {
  for (const options of [{ candidate: false }, { occupied: true }, { room: false }, { failCommit: true }]) {
    const db = fixture(options); await assert.rejects(db.service.intake(doctor, '11', input), (error) => [400, 403, 404, 409].includes(error.status)); assert.equal(db.committed(), 0); assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
  }
  await assert.rejects(fixture().service.intake(doctor, '11', { ...input, doctor_id: '8' }), (error) => error.status === 400);
});
test('first-contact limiter bounds actor attempts and memory, and expires without logging identity', () => {
  let now = 0, accepted = 0, denied;
  const limit = createPrincipalLimiter({ max: 1, maxEntries: 1, windowMs: 1000, now: () => now });
  const response = { set(name, value) { assert.equal(name, 'Retry-After'); assert.ok(Number(value) >= 1); } };
  const next = (error) => error ? denied = error : accepted++;
  limit({ auth: { account_id: '1' } }, response, next); limit({ auth: { account_id: '1' } }, response, next); assert.equal(accepted, 1); assert.equal(denied.status, 429);
  limit({ auth: { account_id: '2' } }, response, next); assert.equal(accepted, 1);
  now = 1001; limit({ auth: { account_id: '2' } }, response, next); assert.equal(accepted, 2);
});

async function httpFixture(t, options = {}, { enabled = true } = {}) {
  const db = fixture(options), originalQuery = db.pool.query.bind(db.pool);
  const account = { account_id: '1', person_id: '7', staff_id: '7', patient_id: null, role_id: '3', branch_id: '9',
    username: 'synthetic-doctor', full_name: 'Synthetic Staff', is_active: true, password_hash: 'synthetic-private-hash', permissions: ['patients-write', 'records-write'] };
  db.pool.query = async (sql, values) => sql.includes('a.mat_khau_ma_hoa AS password_hash') ? { rows: [account] } : originalQuery(sql, values);
  const server = createApp({ pool: db.pool, authConfig: {
    jwtSecret: 'synthetic-first-contact-signing-secret', passwordVerifier: async () => true,
    patientSignupRoleId: enabled ? '4' : undefined,
    actionPermissions: { 'patients.write': ['patients-write'], 'records.write': ['records-write'] },
  } }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: account.username, password: 'synthetic-password' }) });
  assert.equal(login.status, 200);
  const token = (await login.json()).data.token;
  const post = (path, body, authenticated = true) => fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  return { ...db, account, post };
}

test('first-contact HTTP uses both capabilities, staff subtype and safe exact-match responses', async (t) => {
  const db = await httpFixture(t);
  const path = '/patients/first-contact/lookup';
  assert.equal((await db.post(path, contact, false)).status, 401);
  for (const permissions of [['patients-write'], ['records-write'], []]) {
    db.account.permissions = permissions;
    const denied = await db.post(path, contact);
    assert.equal(denied.status, 403); assert.equal((await denied.json()).code, '3101');
  }
  db.account.permissions = ['patients-write', 'records-write'];
  db.account.staff_id = null; db.account.patient_id = '11';
  assert.equal((await db.post(path, contact)).status, 403);
  db.account.staff_id = '7';
  assert.equal((await db.post(path, { ...contact, patient_id: '12' })).status, 400);
  assert.equal(db.calls.length, 0);
  const found = await db.post(path, contact);
  assert.equal(found.status, 200);
  assert.deepEqual(await found.json(), { code: '1000', message: 'OK', data: { patient_id: '11', full_name: 'Synthetic Patient', birth_date: null, gender: null } });
  assert.equal(db.calls.length, 1);
});

test('first-contact HTTP permits exactly one competing intake and does not duplicate identity', async (t) => {
  const db = await httpFixture(t);
  const results = await Promise.all([db.post('/patients/11/first-contact', input), db.post('/patients/11/first-contact', input)]);
  assert.deepEqual(results.map((response) => response.status).sort(), [201, 409]);
  const created = await results.find((response) => response.status === 201).json();
  assert.deepEqual(created, { code: '1000', message: 'OK', data: { patient_id: '11', record_id: '21', visit_id: '22', status: 'draft' } });
  assert.equal(db.committed(), 1);
  const lookup = await db.post('/patients/first-contact/lookup', contact);
  assert.equal(lookup.status, 404); assert.equal((await lookup.json()).data, null);
  assert.ok(!db.calls.some(({ sql }) => /INSERT INTO public\.(nguoi|benhnhan|taikhoan)\b/.test(sql)));
});

test('first-contact HTTP handles absent identity, branch denial, rollback, opt-in and rate limits', async (t) => {
  for (const [options, status] of [[{ candidate: false }, 404], [{ occupied: true }, 409], [{ room: false }, 403], [{ failCommit: true }, 400]]) {
    const db = await httpFixture(t, options);
    const response = await db.post('/patients/11/first-contact', input);
    assert.equal(response.status, status);
    assert.doesNotMatch(JSON.stringify(await response.json()), /synthetic private|SELECT|INSERT|COMMIT/);
    assert.equal(db.committed(), 0); assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
  }
  const disabled = await httpFixture(t, {}, { enabled: false });
  assert.equal((await disabled.post('/patients/first-contact/lookup', contact)).status, 404);
  assert.equal(disabled.calls.length, 0);
  const limited = await httpFixture(t, { candidate: false });
  for (let attempt = 0; attempt < 10; attempt++) assert.equal((await limited.post('/patients/first-contact/lookup', contact)).status, 404);
  const response = await limited.post('/patients/first-contact/lookup', contact);
  assert.equal(response.status, 429); assert.ok(Number(response.headers.get('Retry-After')) > 0);
  assert.equal(limited.calls.length, 10);
});
