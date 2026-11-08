const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkDatabase, METADATA_QUERY } = require('../scripts/check-database');

function fixture({ connectError, queryError, rollbackError, endError, rows } = {}) {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      if (sql === METADATA_QUERY && queryError) throw queryError;
      if (sql === 'ROLLBACK' && rollbackError) throw rollbackError;
      return { rows: rows || [{ server_version: '17.10', read_only: 'on', tls: false }] };
    },
    release(discard) { calls.push(['release', discard]); },
  };
  const pool = {
    async connect() { calls.push('connect'); if (connectError) throw connectError; return client; },
    async end() { calls.push('end'); if (endError) throw endError; },
  };
  return {
    calls,
    options: { loadConfig: () => ({ databaseEnabled: true }), makePool: () => pool },
  };
}

test('DB check uses a read-only transaction and fixed metadata only, then cleans up', async () => {
  const { calls, options } = fixture();
  assert.deepEqual(await checkDatabase(options), { ok: true, serverVersion: '17.10', readOnly: true, tls: false });
  assert.deepEqual(calls, ['connect', 'BEGIN READ ONLY', METADATA_QUERY, 'ROLLBACK', ['release', false], 'end']);
  assert.doesNotMatch(METADATA_QUERY, /(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)/i);
});

test('disabled database performs no pool creation', async () => {
  const result = await checkDatabase({
    loadConfig: () => ({ databaseEnabled: false }),
    makePool: () => assert.fail('disabled check must not create a pool'),
  });
  assert.deepEqual(result, { ok: false, reason: 'database_disabled' });
});

test('configuration errors do not expose private URI or password', async () => {
  const result = await checkDatabase({ loadConfig: () => { throw new Error('postgresql://private:private@private/private'); } });
  assert.deepEqual(result, { ok: false, reason: 'configuration_error' });
  assert.doesNotMatch(JSON.stringify(result), /private/);
});

test('08P01 unsupported startup parameter is distinct from a timeout', async () => {
  const unsupported = fixture({ connectError: Object.assign(new Error('unsupported startup parameter: statement_timeout'), { code: '08P01' }) });
  assert.deepEqual(await checkDatabase(unsupported.options), { ok: false, reason: 'unsupported_startup_parameter' });
  assert.deepEqual(unsupported.calls, ['connect', 'end']);
  const timeout = fixture({ connectError: Object.assign(new Error('private timeout details'), { code: 'ETIMEDOUT' }) });
  assert.deepEqual(await checkDatabase(timeout.options), { ok: false, reason: 'timeout' });
});

test('authentication and network failures are classified without raw server messages', async () => {
  for (const [code, reason] of [['28P01', 'authentication_failed'], ['ECONNREFUSED', 'connection_refused'], ['EPERM', 'network_permission_denied']]) {
    const { options, calls } = fixture({ connectError: Object.assign(new Error('private credentials and endpoint'), { code }) });
    assert.deepEqual(await checkDatabase(options), { ok: false, reason });
    assert.deepEqual(calls, ['connect', 'end']);
  }
});

test('failed metadata query still rolls back and releases client', async () => {
  const { options, calls } = fixture({ queryError: new Error('private query detail') });
  assert.deepEqual(await checkDatabase(options), { ok: false, reason: 'query_failed' });
  assert.deepEqual(calls, ['connect', 'BEGIN READ ONLY', METADATA_QUERY, 'ROLLBACK', ['release', false], 'end']);
});

test('failed rollback discards the client and ends the pool', async () => {
  const { options, calls } = fixture({ queryError: new Error('private query detail'), rollbackError: new Error('private rollback detail') });
  assert.deepEqual(await checkDatabase(options), { ok: false, reason: 'query_failed' });
  assert.deepEqual(calls, ['connect', 'BEGIN READ ONLY', METADATA_QUERY, 'ROLLBACK', ['release', true], 'end']);
});

test('failed pool close is reported without leaking details', async () => {
  const { options, calls } = fixture({ endError: new Error('private cleanup detail') });
  assert.deepEqual(await checkDatabase(options), { ok: false, reason: 'cleanup_failed' });
  assert.deepEqual(calls.slice(-2), [['release', false], 'end']);
});

test('metadata must explicitly confirm read-only mode', async () => {
  const { options } = fixture({ rows: [{ server_version: '17.10', read_only: 'off', tls: false }] });
  assert.deepEqual(await checkDatabase(options), { ok: false, reason: 'read_only_not_confirmed' });
});
