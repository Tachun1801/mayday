const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app/app');
const { readConfig } = require('../src/config/env');
const { errorHandler } = require('../src/shared/http');
const { createDatabasePool } = require('../src/database/pool');

const absentEnv = '/tmp/mayday-foundation-missing-env-file';

test('configuration rejects invalid ports and hides invalid connection details', () => {
  for (const port of ['0', '-1', '3.5', '65536', '3000junk']) {
    assert.throws(() => readConfig({ PORT: port }, absentEnv), /PORT/);
  }
  assert.throws(() => readConfig({ NODE_ENV: 'invalid' }, absentEnv), /NODE_ENV/);
  assert.throws(() => readConfig({ DATABASE_URL: 'private-invalid-value' }, absentEnv), {
    message: 'DATABASE_URL must be a PostgreSQL URL; use sslmode=verify-full for TLS or explicitly approved sslmode=disable',
  });
  assert.equal(readConfig({ PORT: '3456' }, absentEnv).port, 3456);
  assert.throws(() => readConfig({ DATABASE_ENABLED: 'yes' }, absentEnv), /DATABASE_ENABLED/);
  assert.throws(() => readConfig({ DATABASE_ENABLED: 'true' }, absentEnv), /DATABASE_URL/);
  assert.equal(readConfig({ DATABASE_ENABLED: 'true', DATABASE_URL: 'postgresql://unused:unused@localhost/unused?sslmode=disable' }, absentEnv).databaseEnabled, true);
  assert.throws(() => readConfig({ DATABASE_ENABLED: 'true', DATABASE_URL: 'postgresql://unused:unused@localhost/unused?sslmode=unknown' }, absentEnv), /DATABASE_URL/);
  assert.equal(readConfig({ DATABASE_URL: 'postgresql://unused:unused@localhost/unused?sslmode=disable' }, absentEnv).databaseEnabled, false);
});

test('database is optional and creating a pool makes no connections', async () => {
  assert.equal(createDatabasePool({}), null);
  const pool = createDatabasePool({ databaseEnabled: true, databaseUrl: 'postgresql://unused:unused@localhost:1/unused?sslmode=require' });
  assert.equal(pool.totalCount, 0);
  assert.equal(pool.options.statement_timeout, undefined);
  assert.equal(pool.options.ssl.rejectUnauthorized, true);
  assert.doesNotMatch(pool.options.connectionString, /sslmode/);
  await pool.end();
  const plainPool = createDatabasePool({ databaseEnabled: true, databaseUrl: 'postgresql://unused:unused@localhost:1/unused?sslmode=disable' });
  assert.equal(plainPool.options.ssl, false);
  assert.equal(plainPool.totalCount, 0);
  await plainPool.end();
});

test('HTTP health, missing route and malformed JSON are controlled', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(`${base}/api/v1/patients`)).status, 404);
  const invalid = await fetch(`${base}/health`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{private-input',
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { code: '2007', message: 'Request body invalid', data: null });
  const large = await fetch(`${base}/health`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(110000) }),
  });
  assert.equal(large.status, 413);
});

test('unexpected errors never expose internal details', () => {
  const response = {
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
  errorHandler(new Error('private database details'), {}, response, () => {});
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { code: '9901', message: 'Internal server error', data: null });
});
