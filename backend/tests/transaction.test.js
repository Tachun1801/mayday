const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withTransaction } = require('../src/database/transaction');

function fakePool(failures = {}) {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      if (failures[sql]) throw failures[sql];
    },
    release(discard) { calls.push(['release', discard]); },
  };
  const pool = {
    async connect() { calls.push('connect'); return client; },
    query() { assert.fail('Transaction must not use pool.query'); },
  };
  return { pool, client, calls };
}

test('transaction uses one acquired client and returns callback result only after commit', async () => {
  const { pool, client, calls } = fakePool();
  const result = await withTransaction(pool, async (transactionClient) => {
    assert.equal(transactionClient, client);
    await transactionClient.query('operation one');
    await transactionClient.query('operation two');
    return 'operation result';
  });
  assert.equal(result, 'operation result');
  assert.deepEqual(calls, ['connect', 'BEGIN', 'operation one', 'operation two', 'COMMIT', ['release', false]]);
});

test('callback failure rolls back and preserves original error', async () => {
  const { pool, calls } = fakePool();
  const failure = new Error('operation failed');
  await assert.rejects(withTransaction(pool, async () => { throw failure; }), (error) => error === failure);
  assert.deepEqual(calls, ['connect', 'BEGIN', 'ROLLBACK', ['release', false]]);
});

test('failed BEGIN never calls operation and still rolls back/releases', async () => {
  const failure = new Error('begin failed');
  const { pool, calls } = fakePool({ BEGIN: failure });
  await assert.rejects(withTransaction(pool, async () => assert.fail('operation should not run')), (error) => error === failure);
  assert.deepEqual(calls, ['connect', 'BEGIN', 'ROLLBACK', ['release', false]]);
});

test('failed COMMIT rolls back and preserves failure', async () => {
  const failure = new Error('commit failed');
  const { pool, calls } = fakePool({ COMMIT: failure });
  await assert.rejects(withTransaction(pool, async () => 'result'), (error) => error === failure);
  assert.deepEqual(calls, ['connect', 'BEGIN', 'COMMIT', 'ROLLBACK', ['release', false]]);
});

test('failed rollback discards client and retains original and cleanup errors', async () => {
  const failure = new Error('operation failed');
  const rollbackFailure = new Error('rollback failed');
  const { pool, calls } = fakePool({ ROLLBACK: rollbackFailure });
  await assert.rejects(withTransaction(pool, async () => { throw failure; }), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.cause, failure);
    assert.deepEqual(error.errors, [failure, rollbackFailure]);
    return true;
  });
  assert.deepEqual(calls, ['connect', 'BEGIN', 'ROLLBACK', ['release', true]]);
});

test('failed acquisition does not attempt transaction or release an absent client', async () => {
  const failure = new Error('connect failed');
  const pool = { async connect() { throw failure; } };
  await assert.rejects(withTransaction(pool, async () => assert.fail('operation should not run')), (error) => error === failure);
});

test('explicit read-committed option is fixed SQL and unknown isolation never opens a connection', async () => {
  const calls = [], client = { async query(sql) { calls.push(sql); return { rows: [] }; }, release() { calls.push('release'); } };
  const pool = { async connect() { return client; } };
  await withTransaction(pool, async () => true, { isolation: 'read_committed' });
  assert.deepEqual(calls, ['BEGIN ISOLATION LEVEL READ COMMITTED', 'COMMIT', 'release']);
  await assert.rejects(withTransaction({ connect() { assert.fail('must reject before connect'); } }, async () => true, { isolation: 'invalid; DROP' }));
});
