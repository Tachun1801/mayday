const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAdministrationRepository } = require('../src/modules/administration/administration.repository');
const { createApp } = require('../src/app/app');
const { DEFAULT_ACTION_PERMISSIONS } = require('../src/config/auth');
const { once } = require('node:events');

test('administration SQL is fixed, paginated and excludes credential fields', async () => {
  const calls = [];
  const pool = { async query(sql, values) {
    calls.push({ sql, values });
    return sql.startsWith('SELECT count') ? { rows: [{ total: '1' }] } : { rows: [{ account_id: '9007199254740993', username: 'fixture' }] };
  } };
  const result = await createAdministrationRepository(pool).list('accounts', 2, 10, { staff_id: '7', branch_id: 'untrusted' });
  assert.equal(result.items[0].account_id, '9007199254740993');
  assert.equal(result.total, 1);
  assert.deepEqual(calls[0].values, ['7']);
  assert.deepEqual(calls[1].values, ['7', 10, 10]);
  for (const call of calls) {
    assert.match(call.sql, /JOIN public\.nhanvien s/);
    assert.match(call.sql, /s\.ma_chi_nhanh = \(SELECT actor\.ma_chi_nhanh FROM public\.nhanvien actor WHERE actor\.ma_nhan_vien = \$1\)/);
    assert.doesNotMatch(call.sql, /LEFT JOIN|untrusted/);
  }
  assert.doesNotMatch(calls[1].sql, /mat_khau|so_dien_thoai|SELECT \*/i);
  await assert.rejects(createAdministrationRepository(pool).list('accounts; DROP TABLE anything', 1, 10));
  assert.equal(calls.length, 2);
  await assert.rejects(createAdministrationRepository(pool).list('accounts', 1, 10, { patient_id: '11' }));
  assert.equal(calls.length, 2);
});

test('administration HTTP reloads capability, denies patient-only users and scopes account reads by staff', async (t) => {
  const account = { account_id: '1', person_id: '7', staff_id: '7', patient_id: null, role_id: '1', branch_id: '9',
    username: 'synthetic-admin', full_name: 'Synthetic Admin', is_active: true, password_hash: 'synthetic-internal', permissions: ['manage_users_v2'] };
  const calls = [];
  const pool = { async query(sql, values) {
    if (sql.includes('a.mat_khau_ma_hoa AS password_hash')) return { rows: [account] };
    calls.push({ sql, values });
    assert.match(sql, /s\.ma_chi_nhanh = \(SELECT actor\.ma_chi_nhanh/);
    assert.equal(values[0], '7');
    return sql.startsWith('SELECT count') ? { rows: [{ total: '1' }] } : { rows: [{ account_id: '9', person_id: '8', username: 'synthetic-staff', full_name: 'Synthetic Staff', role_id: '2', is_active: true, branch_id: '9' }] };
  } };
  const server = createApp({ pool, authConfig: { jwtSecret: 'synthetic-admin-http-signing-secret', passwordVerifier: async () => true, actionPermissions: DEFAULT_ACTION_PERMISSIONS } }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  assert.equal((await fetch(`${base}/admin/accounts`)).status, 401);
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: account.username, password: 'synthetic-password' }) });
  const headers = { Authorization: `Bearer ${(await login.json()).data.token}` };
  const response = await fetch(`${base}/admin/accounts?branch_id=123`, { headers });
  assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.code, '1000'); assert.equal(body.data.items.length, 1);
  assert.equal(body.data.items[0].branch_id, '9'); assert.equal(body.data.total, 1);
  assert.doesNotMatch(JSON.stringify(body), /password|phone|synthetic-internal/);
  assert.equal(calls.length, 2);
  assert.equal((await fetch(`${base}/admin/accounts?limit=101`, { headers })).status, 400);
  account.staff_id = null; account.patient_id = '7';
  for (const path of ['/admin/accounts', '/admin/roles', '/admin/permissions', '/admin/roles/1/permissions']) assert.equal((await fetch(`${base}${path}`, { headers })).status, 403);
  account.staff_id = '7'; account.permissions = [];
  assert.equal((await fetch(`${base}/admin/accounts`, { headers })).status, 403);
  assert.equal(calls.length, 2);
});
