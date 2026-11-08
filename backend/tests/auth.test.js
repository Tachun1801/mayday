const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createAuthModule, createLoginLimiter } = require('../src/modules/auth/auth');
const { verifyBcryptPassword } = require('../src/modules/auth/auth.service');
const SECRET = 'synthetic-auth-test-secret-at-least-32-bytes';
const PASSWORD = 'fixture-only-password';
const HASH = bcrypt.hashSync(PASSWORD, 4);

function fixture() {
  const account = {
    account_id: '9007199254740993', person_id: '9007199254740995', username: 'fixture', full_name: 'Synthetic Fixture', role_id: '3',
    branch_id: '2', staff_id: '9007199254740995', patient_id: null, password_hash: HASH, is_active: true, permissions: ['fixture.read'],
  };
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      assert.match(sql.trim(), /^SELECT /);
      assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i);
      const found = sql.includes('lower(a.ten_dang_nhap)') ? params[0].toLowerCase() === account.username.toLowerCase() : params[0] === account.account_id;
      return { rows: found ? [{ ...account, permissions: [...account.permissions] }] : [] };
    },
  };
  return { account, calls, auth: createAuthModule({ pool, jwtSecret: SECRET, actionPermissions: { read: 'fixture.read' } }) };
}
function runMiddleware(middleware, req) { return new Promise((resolve) => middleware(req, {}, (error) => resolve(error))); }
function request(token) { return { get: () => token == null ? undefined : `Bearer ${token}` }; }

test('login returns safe string IDs and HS256 JWT, with no hash or private account fields', async () => {
  const { auth, account, calls } = fixture();
  const result = await auth.service.login({ username: 'Fixture', password: PASSWORD });
  assert.equal(result.expires_in, 900);
  assert.equal(result.user_info.account_id, account.account_id);
  assert.equal(result.user_info.person_id, account.person_id);
  assert.equal(result.user_info.patient_id, null);
  assert.deepEqual(result.user_info.permissions, ['fixture.read']);
  assert.doesNotMatch(JSON.stringify(result), /password_hash|is_active/);
  assert.ok(!JSON.stringify(result).includes(HASH));
  const claims = jwt.verify(result.token, SECRET, { algorithms: ['HS256'], issuer: 'mayday', audience: 'mayday-clients' });
  assert.equal(claims.sub, account.account_id);
  assert.equal(claims.exp - claims.iat, 900);
  assert.equal(claims.credential_version.length, 64);
  assert.ok(!JSON.stringify(claims).includes(HASH));
  assert.deepEqual(calls[0].params, ['Fixture']);
  assert.match(calls[0].sql, /lower\(\$1\)/);
});

test('unknown username, wrong password and inactive account use the same controlled rejection', async () => {
  const { auth, account } = fixture();
  for (const input of [{ username: 'missing', password: PASSWORD }, { username: 'fixture', password: 'wrong' }]) {
    await assert.rejects(auth.service.login(input), { status: 401, code: '3008', message: 'Invalid username or password', expose: true });
  }
  account.is_active = false;
  await assert.rejects(auth.service.login({ username: 'fixture', password: PASSWORD }), { status: 401, code: '3008' });
});

test('invalid login input is rejected before SQL, including oversized bcrypt input', async () => {
  const { auth, calls } = fixture();
  for (const input of [null, [], {}, { username: '', password: PASSWORD }, { username: 'fixture', password: 'x'.repeat(73) }]) {
    await assert.rejects(auth.service.login(input), { status: 400, code: '2003' });
  }
  assert.equal(calls.length, 0);
});

test('authentication rejects missing, invalid, expired and wrong-algorithm JWT with 401', async () => {
  const { auth } = fixture();
  assert.equal((await runMiddleware(auth.authenticate, request())).code, '3003');
  assert.equal((await runMiddleware(auth.authenticate, request('bad-token'))).status, 401);
  const expired = jwt.sign({ exp: 1 }, SECRET, { algorithm: 'HS256', issuer: 'mayday', audience: 'mayday-clients', subject: '1' });
  assert.equal((await runMiddleware(auth.authenticate, request(expired))).code, '3002');
  const wrongAlgorithm = jwt.sign({}, SECRET, { algorithm: 'HS384', issuer: 'mayday', audience: 'mayday-clients', subject: '1' });
  assert.equal((await runMiddleware(auth.authenticate, request(wrongAlgorithm))).code, '3001');
});

test('authentication reloads active status and actual permission names on every request', async () => {
  const { auth, account } = fixture();
  const { token } = await auth.service.login({ username: 'fixture', password: PASSWORD });
  const req = request(token);
  assert.equal(await runMiddleware(auth.authenticate, req), undefined);
  assert.equal(req.auth.account_id, account.account_id);
  account.permissions = ['fixture.changed'];
  const second = request(token);
  assert.equal(await runMiddleware(auth.authenticate, second), undefined);
  assert.deepEqual(second.auth.permissions, ['fixture.changed']);
  account.is_active = false;
  assert.equal((await runMiddleware(auth.authenticate, request(token))).status, 401);
});

test('changing stored hash invalidates old JWT without exposing password hash', async () => {
  const { auth, account } = fixture();
  const { token } = await auth.service.login({ username: 'fixture', password: PASSWORD });
  account.password_hash = bcrypt.hashSync('replacement-fixture-password', 4);
  await assert.rejects(auth.service.authenticateToken(token), { status: 401, code: '3001' });
});

test('authorize denies absent principal, unmapped action and missing permission; no role-name bypass', async () => {
  const { auth } = fixture();
  assert.equal((await runMiddleware(auth.authorize('read'), {})).status, 401);
  assert.equal((await runMiddleware(auth.authorize('unmapped'), { auth: { permissions: ['fixture.read'], role_id: 'admin' } })).status, 403);
  assert.equal((await runMiddleware(auth.authorize('read'), { auth: { permissions: [], role_id: 'admin' } })).status, 403);
  assert.equal(await runMiddleware(auth.authorize('read'), { auth: { permissions: ['fixture.read'] } }), undefined);
});

test('loadPrincipal distinguishes account/person and rejects malformed IDs before querying', async () => {
  const { auth, account, calls } = fixture();
  const principal = await auth.loadPrincipal(account.account_id);
  assert.equal(principal.person_id, account.person_id);
  assert.equal(principal.account_id, account.account_id);
  assert.ok(!Object.hasOwn(principal, 'password_hash'));
  assert.deepEqual(calls[0].params, [account.account_id]);
  const before = calls.length;
  for (const id of ['1 OR 1=1', '9223372036854775808', '-1']) {
    await assert.rejects(auth.loadPrincipal(id), { status: 401, code: '3001' });
  }
  assert.equal(calls.length, before);
});

test('password verifier recognizes bcrypt and refuses plaintext/unsupported stored hashes', async () => {
  assert.equal(await verifyBcryptPassword(PASSWORD, HASH), true);
  assert.equal(await verifyBcryptPassword('wrong', HASH), false);
  assert.equal(await verifyBcryptPassword(PASSWORD, PASSWORD), false);
});

test('login limiter bounds local attempts/source entries and expires them', () => {
  let now = 0;
  const limiter = createLoginLimiter({ now: () => now, maxEntries: 1, maxAttempts: 2, windowMs: 1000 });
  const response = { set() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  let passed = 0;
  const next = () => { passed += 1; };
  limiter({ ip: 'synthetic-source' }, response, next);
  limiter({ ip: 'synthetic-source' }, response, next);
  limiter({ ip: 'synthetic-source' }, response, next);
  assert.equal(passed, 2);
  assert.equal(response.statusCode, 429);
  limiter({ ip: 'another-source' }, response, next);
  assert.equal(passed, 2);
  now = 1000;
  limiter({ ip: 'another-source' }, response, next);
  assert.equal(passed, 3);
});

test('auth HTTP contract returns safe envelopes and /me ignores client-selected account IDs', async (t) => {
  const express = require('express');
  const { once } = require('node:events');
  const { errorHandler } = require('../src/shared/http');
  const { auth, account } = fixture();
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', auth.router);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/auth`;
  const missing = await fetch(`${base}/me`);
  assert.equal(missing.status, 401);
  assert.equal((await missing.json()).code, '3003');
  const invalid = await fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).code, '2003');
  const login = await fetch(`${base}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'fixture', password: PASSWORD }),
  });
  assert.equal(login.status, 200);
  const envelope = await login.json();
  assert.equal(envelope.code, '1000');
  assert.equal(envelope.data.expires_in, 900);
  const me = await fetch(`${base}/me?account_id=other-account`, { headers: { Authorization: `Bearer ${envelope.data.token}` } });
  assert.equal(me.status, 200);
  const body = await me.json();
  assert.equal(body.data.user_info.account_id, account.account_id);
  assert.ok(!JSON.stringify(body).includes(HASH));
  assert.ok(!JSON.stringify(body).includes('password_hash'));
});
