const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { readConfig } = require('../src/config/env');

function createEnvFile(t, content) {
  const directory = mkdtempSync(join(tmpdir(), 'mayday-env-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filePath = join(directory, '.env');
  writeFileSync(filePath, content);
  return filePath;
}

test('legacy PostgreSQL URI survives comments, blank lines and CRLF', (t) => {
  const uri = 'postgresql://fixture:unused@localhost:1/fixture?sslmode=disable';
  const filePath = createEnvFile(t, [
    '# Synthetic configuration; never connects to PostgreSQL.',
    '',
    uri,
    '  # DB_PASSWORD=comment-is-not-configuration',
    '',
  ].join('\r\n'));

  const config = readConfig({}, filePath);
  assert.equal(config.databaseUrl, uri);
  assert.equal(config.databaseEnabled, false);
});

test('quoted assignments preserve URI characters rather than treating them as comments', (t) => {
  const uri = 'postgresql://fixture:p%23word%40value@localhost:1/fixture?sslmode=disable';
  const filePath = createEnvFile(t, [
    '# Synthetic KEY=value configuration.',
    'NODE_ENV="test"',
    "HOST='127.0.0.1'",
    'PORT="3456"',
    'DATABASE_ENABLED="true"',
    `DATABASE_URL='${uri}'`,
    '# DATABASE_ENABLED=false',
  ].join('\n'));

  assert.deepEqual(readConfig({}, filePath), {
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 3456,
    databaseEnabled: true,
    databaseUrl: uri,
  });
});

test('process environment overrides file configuration and can disable its database', (t) => {
  const filePath = createEnvFile(t, [
    'NODE_ENV=development',
    'PORT=3456',
    'DATABASE_ENABLED=true',
    'DATABASE_URL="postgresql://fixture:unused@localhost:1/fixture?sslmode=disable"',
  ].join('\n'));
  const uri = 'postgresql://override:unused@localhost:2/fixture?sslmode=verify-full';

  const config = readConfig({
    NODE_ENV: 'test', PORT: '4567', DATABASE_ENABLED: 'false', DATABASE_URL: uri,
  }, filePath);
  assert.equal(config.nodeEnv, 'test');
  assert.equal(config.port, 4567);
  assert.equal(config.databaseUrl, uri);
  assert.equal(config.databaseEnabled, false);
});

test('disabled database needs no connection URI in an environment file', (t) => {
  const filePath = createEnvFile(t, 'NODE_ENV=test\nDATABASE_ENABLED=false\n');
  const config = readConfig({}, filePath);
  assert.equal(config.databaseEnabled, false);
  assert.equal(config.databaseUrl, undefined);
});

test('invalid connection configuration errors never include private values', (t) => {
  const privateMarker = 'synthetic-private-value';
  const uri = `https://fixture:${privateMarker}@localhost/fixture`;
  const filePath = createEnvFile(t, `DATABASE_ENABLED=true\nDATABASE_URL="${uri}"\n`);

  assert.throws(() => readConfig({}, filePath), (error) => {
    assert.match(error.message, /^DATABASE_URL must be a PostgreSQL URL/);
    assert.ok(!error.message.includes(privateMarker));
    assert.ok(!error.message.includes(uri));
    assert.equal(error.cause, undefined);
    return true;
  });
});
