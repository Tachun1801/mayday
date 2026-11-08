const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { createSignupService } = require('../src/modules/auth/signup.service');
const { validateSignup } = require('../src/modules/auth/signup.validation');
const { createAuthModule } = require('../src/modules/auth/auth');
const { errorHandler } = require('../src/shared/http');
const valid = { username: 'synthetic-patient', password: 'synthetic-password', full_name: 'Synthetic Patient', phone: '0000000000', gender: 'Nu' };
function fixture({ fail = '', role = true } = {}) {
  const calls = [], client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (fail && sql.includes(fail)) throw Object.assign(new Error('synthetic private SQL'), { code: fail === 'COMMIT' ? '23503' : '23505' });
      if (sql.startsWith('SELECT ma_vai_tro')) { assert.deepEqual(values, ['4']); return { rows: role ? [{ id: '4' }] : [] }; }
      if (sql.startsWith('INSERT INTO public.nguoi')) return { rows: [{ id: '9007199254740993' }] };
      if (sql.startsWith('INSERT INTO public.taikhoan')) return { rows: [{ id: '9007199254740994' }] };
      return { rows: [] };
    }, release() { calls.push({ sql: 'release' }); },
  };
  const pool = { async connect() { return client; } };
  return { calls, pool, signup: createSignupService(pool, '4', { hashPassword: async () => '$2b$12$synthetic-private-hash' }) };
}
test('patient signup rejects role/identity injection, malformed dates and bcrypt truncation', () => {
  for (const body of [{ ...valid, role_id: '1' }, { ...valid, patient_id: '11' }, { ...valid, is_active: true }, { ...valid, password: 'short' }, { ...valid, password: 'é'.repeat(37) }, { ...valid, phone: '000' }, { ...valid, birth_date: '2026-02-30' }, { ...valid, gender: 'other' }]) assert.throws(() => validateSignup(body));
  assert.equal(validateSignup(valid).phone, '0000000000');
});
test('signup creates fresh person/patient/account atomically and never links by shared phone', async () => {
  const db = fixture(); const result = await db.signup(valid);
  assert.deepEqual(result, { account_id: '9007199254740994', patient_id: '9007199254740993' });
  assert.doesNotMatch(JSON.stringify(result), /password|hash|phone|token|verified/);
  const insert = db.calls.find(({ sql }) => sql.startsWith('INSERT INTO public.taikhoan')); assert.equal(insert.values[1], '4'); assert.match(insert.values[3], /^\$2b\$12\$/);
  assert.ok(!db.calls.some(({ sql }) => sql.includes('WHERE so_dien_thoai'))); assert.equal(db.calls[0].sql, 'BEGIN'); assert.equal(db.calls.at(-2).sql, 'COMMIT');
});
test('signup missing role, uniqueness and COMMIT failures roll back all identity rows', async () => {
  for (const options of [{ role: false }, { fail: 'INSERT INTO public.taikhoan' }, { fail: 'COMMIT' }]) {
    const db = fixture(options); await assert.rejects(db.signup(valid)); assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
    if (options.role === false) assert.ok(!db.calls.some(({ sql }) => sql.startsWith('INSERT')));
  }
});
test('signup HTTP is opt-in, public, rate-limited and exposes only confirmed identifiers', async (t) => {
  const db = fixture(), app = express(); app.use(express.json());
  app.use('/auth', createAuthModule({ pool: db.pool, jwtSecret: 'synthetic-signing-secret-for-registration', patientSignupRoleId: '4' }).router);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1'); t.after(() => new Promise((resolve) => server.close(resolve))); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/auth/signup`, post = (data) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const success = await post(valid); assert.equal(success.status, 201); const data = await success.json(); assert.equal(data.code, '1000'); assert.doesNotMatch(JSON.stringify(data), /password|hash|otp|token/);
  const before = db.calls.length; assert.equal((await post({ ...valid, role_id: '1' })).status, 400); assert.equal(db.calls.length, before);
  for (let i = 0; i < 3; i++) assert.equal((await post({})).status, 400);
  assert.equal((await post(valid)).status, 429);
});
