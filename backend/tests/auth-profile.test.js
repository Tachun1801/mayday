const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createAuthModule } = require('../src/modules/auth/auth');

const PASSWORD = 'fixture-old-password';
const NEW_PASSWORD = 'fixture-new-password';
const HASH = bcrypt.hashSync(PASSWORD, 4);

function fixture({ race = false } = {}) {
  const account = {
    account_id: '100', person_id: '300', username: 'fixture', full_name: 'Synthetic Fixture',
    role_id: '4', branch_id: null, staff_id: null, patient_id: '300', permissions: [],
    phone: '0000000000', birth_date: null, gender: null, password_hash: HASH, is_active: true,
  };
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.trim().startsWith('SELECT')) return { rows: [{ ...account, permissions: [...account.permissions] }] };
      if (sql.startsWith('UPDATE public.nguoi')) {
        assert.equal(params.at(-2), account.person_id);
        assert.equal(params.at(-1), account.account_id);
        assert.match(sql, /WHERE ma_nguoi = \$/);
        assert.match(sql, /a\.trang_thai_hoat_dong = true/);
        const columns = [...sql.matchAll(/(ho_ten|so_dien_thoai|ngay_sinh|gioi_tinh) = \$(\d+)/g)];
        const fields = { ho_ten: 'full_name', so_dien_thoai: 'phone', ngay_sinh: 'birth_date', gioi_tinh: 'gender' };
        for (const [, column, position] of columns) account[fields[column]] = params[Number(position) - 1];
        return { rows: [{ person_id: account.person_id }] };
      }
      if (sql.startsWith('UPDATE public.taikhoan')) {
        assert.match(sql, /ma_tai_khoan = \$2 AND mat_khau_ma_hoa = \$3 AND trang_thai_hoat_dong = true/);
        assert.equal(params[1], account.account_id);
        assert.equal(params[2], account.password_hash);
        if (race) return { rows: [] };
        account.password_hash = params[0];
        return { rows: [{ account_id: account.account_id }] };
      }
      assert.fail('Unexpected query');
    },
  };
  return { account, calls, auth: createAuthModule({ pool, jwtSecret: 'synthetic-profile-test-secret-at-least-32-bytes' }) };
}

test('own-profile patch updates only authenticated person and returns a safe refreshed DTO', async () => {
  const { auth, account, calls } = fixture();
  const response = await auth.service.updateOwnProfile(account.account_id, { full_name: '  Updated Fixture  ', phone: '1111111111', birth_date: '2000-02-29', gender: 'Nu' });
  assert.equal(response.user_info.full_name, 'Updated Fixture');
  assert.equal(response.user_info.phone, '1111111111');
  assert.equal(response.user_info.birth_date, '2000-02-29');
  assert.equal(response.user_info.gender, 'Nu');
  assert.equal(response.user_info.person_id, '300');
  assert.equal(response.user_info.account_id, '100');
  assert.ok(!JSON.stringify(response).includes(HASH));
  assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE')).length, 1);
});

test('mass assignment, empty patches and malformed profile fields never issue writes', async () => {
  const { auth, account, calls } = fixture();
  for (const patch of [
    {}, { person_id: 'other' }, { role_id: 'admin' }, { branch_id: '9' }, { account_id: 'other' },
    { full_name: ' ' }, { full_name: 'x'.repeat(151) }, { full_name: null },
    { phone: '123' }, { phone: null }, { gender: 'Other' },
    { birth_date: '2000-02-30' }, { birth_date: '0000-01-01' }, { birth_date: '9999-01-01' }, { birth_date: 2000 },
  ]) {
    await assert.rejects(auth.service.updateOwnProfile(account.account_id, patch), (error) => error.status === 400);
  }
  assert.equal(calls.length, 0);
});

test('nullable birth date/gender and single-field patches preserve untouched profile fields', async () => {
  const { auth, account } = fixture();
  account.birth_date = '2000-01-01';
  account.gender = 'Nam';
  await auth.service.updateOwnProfile(account.account_id, { birth_date: null, gender: null });
  assert.equal(account.birth_date, null);
  assert.equal(account.gender, null);
  assert.equal(account.full_name, 'Synthetic Fixture');
  assert.equal(account.phone, '0000000000');
});

test('wrong old password and invalid new passwords cannot change credentials', async () => {
  const { auth, account, calls } = fixture();
  await assert.rejects(auth.service.changePassword(account.account_id, { old_password: 'wrong', new_password: NEW_PASSWORD }), { status: 400, code: '3009' });
  for (const body of [
    {}, { old_password: PASSWORD, new_password: 'short' },
    { old_password: PASSWORD, new_password: 'x'.repeat(73) },
    { old_password: PASSWORD, new_password: NEW_PASSWORD, account_id: 'another' },
  ]) {
    await assert.rejects(auth.service.changePassword(account.account_id, body), { status: 400, code: '2003' });
  }
  assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE')).length, 0);
  assert.equal(account.password_hash, HASH);
});

test('password change writes bcrypt12 conditionally, exposes no hash and invalidates existing JWT', async () => {
  const { auth, account, calls } = fixture();
  const { token } = await auth.service.login({ username: 'fixture', password: PASSWORD });
  assert.deepEqual(await auth.service.changePassword(account.account_id, { old_password: PASSWORD, new_password: NEW_PASSWORD }), { reauthenticate: true });
  assert.match(account.password_hash, /^\$2[aby]\$12\$/);
  assert.equal(await bcrypt.compare(NEW_PASSWORD, account.password_hash), true);
  assert.equal(await bcrypt.compare(PASSWORD, account.password_hash), false);
  assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE public.taikhoan')).length, 1);
  await assert.rejects(auth.service.authenticateToken(token), { status: 401, code: '3001' });
});

test('concurrent credential change cannot overwrite another stored hash', async () => {
  const { auth, account, calls } = fixture({ race: true });
  await assert.rejects(auth.service.changePassword(account.account_id, { old_password: PASSWORD, new_password: NEW_PASSWORD }), { status: 409, code: '3009' });
  assert.equal(account.password_hash, HASH);
  assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE public.taikhoan')).length, 1);
});

test('self-service HTTP routes reject ID injection, return safe profile and require reauthentication after password change', async (t) => {
  const express = require('express');
  const { once } = require('node:events');
  const { errorHandler } = require('../src/shared/http');
  const { auth, account, calls } = fixture();
  const { token } = await auth.service.login({ username: 'fixture', password: PASSWORD });
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', auth.router);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/auth`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const unauthenticated = await fetch(`${base}/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"full_name":"Updated Fixture"}' });
  assert.equal(unauthenticated.status, 401);
  const injected = await fetch(`${base}/me`, { method: 'PUT', headers, body: '{"person_id":"another-person","full_name":"Wrong Owner"}' });
  assert.equal(injected.status, 400);
  assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE')).length, 0);
  const profile = await fetch(`${base}/me`, { method: 'PUT', headers, body: '{"full_name":"Updated Fixture"}' });
  assert.equal(profile.status, 200);
  const profileBody = await profile.json();
  assert.equal(profileBody.code, '1000');
  assert.equal(profileBody.data.user_info.person_id, account.person_id);
  assert.equal(profileBody.data.user_info.full_name, 'Updated Fixture');
  const password = await fetch(`${base}/change-password`, { method: 'POST', headers, body: JSON.stringify({ old_password: PASSWORD, new_password: NEW_PASSWORD }) });
  assert.equal(password.status, 200);
  assert.deepEqual(await password.json(), { code: '1000', message: 'OK', data: { reauthenticate: true } });
  assert.equal((await fetch(`${base}/me`, { headers })).status, 401);
});
