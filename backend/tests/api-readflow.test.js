const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app/app');

const secret = 'synthetic-jwt-signing-key-for-tests-only';

test('integrated login/profile/read flows enforce permission and return safe DTOs', async (t) => {
  const account = {
    account_id: '1', person_id: '2', role_id: '3', staff_id: '2', branch_id: '4', patient_id: null,
    username: 'fixture', full_name: 'Synthetic user', password_hash: 'internal-only-fixture',
    is_active: true, permissions: ['manage_medical_records'],
  };
  const calls = [];
  const pool = { async query(sql, values) {
    calls.push({ sql, values });
    if (sql.includes('a.mat_khau_ma_hoa AS password_hash')) return { rows: [account] };
    if (sql.startsWith('SELECT count')) return { rows: [{ total: '0' }] };
    return { rows: [] };
  } };
  const server = createApp({ pool, authConfig: {
    jwtSecret: secret, passwordVerifier: async () => true,
    actionPermissions: { 'records.read': ['manage_medical_records'], 'accounts.read': ['manage_users'] },
  } }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  assert.equal((await fetch(`${base}/medical-records`)).status, 401);
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'fixture', password: 'synthetic-password' }),
  });
  assert.equal(login.status, 200);
  const credentials = await login.json();
  assert.equal(credentials.data.expires_in, 900);
  assert.doesNotMatch(JSON.stringify(credentials), /internal-only-fixture|password_hash/);
  const headers = { Authorization: `Bearer ${credentials.data.token}` };
  const me = await fetch(`${base}/auth/me`, { headers });
  assert.equal((await me.json()).data.user_info.account_id, '1');
  const records = await fetch(`${base}/medical-records`, { headers });
  assert.equal(records.status, 200);
  assert.deepEqual((await records.json()).data, { items: [], total: 0, page: 1, limit: 20 });
  assert.equal((await fetch(`${base}/admin/accounts`, { headers })).status, 403);
  assert.equal((await fetch(`${base}/medical-records?limit=101`, { headers })).status, 400);
  assert.ok(calls.every(({ sql }) => /^\s*SELECT/.test(sql)));
});
