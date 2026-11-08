const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { createRecordWorkflowService } = require('../src/modules/clinical/record-workflow.service');
const { createClinicalRouter } = require('../src/modules/clinical/clinical.routes');
const { HttpError } = require('../src/shared/errors');
const { errorHandler } = require('../src/shared/http');

// In-memory transaction double with a queued row lock. It models serialized
// competing operations; it is not a PostgreSQL integration test.
function database({ status = 'draft', assigned = true, updateMissing = false, failCommit = false } = {}) {
  const calls = [];
  let tail = Promise.resolve();
  let current = status;
  const pool = {
    async connect() {
      let unlock;
      let original;
      let locked = false;
      const client = {
        async query(sql, values) {
          calls.push({ client, sql, values });
          if (sql.includes('FOR UPDATE OF h')) {
            const preceding = tail;
            tail = new Promise((resolve) => { unlock = resolve; });
            await preceding;
            locked = true;
            original = current;
            assert.deepEqual(values, ['9007199254740993', '7']);
            assert.match(sql, /v\.ma_ho_so = h\.ma_ho_so AND v\.ma_bac_si = \$2/);
            return { rows: assigned ? [{ id: values[0], status: current }] : [] };
          }
          if (sql.startsWith('UPDATE')) {
            assert.ok(locked);
            assert.match(sql, /h\.trang_thai = \$3 AND EXISTS/);
            assert.match(sql, /v\.ma_bac_si = \$2/);
            assert.equal(values[2], current);
            if (updateMissing) return { rows: [] };
            current = values[3];
            return { rows: [{ id: values[0], status: current }] };
          }
          if (sql === 'COMMIT' && failCommit) throw new Error('synthetic private commit failure');
          if (sql === 'ROLLBACK' && locked) current = original;
          return { rows: [] };
        },
        release() { if (locked) unlock(); },
      };
      return client;
    },
    query() { throw new Error('Workflow must use the acquired transaction client'); },
  };
  return { pool, calls, status: () => current };
}

const id = '9007199254740993';
const doctor = { staff_id: '7' };

for (const [source, target] of [['draft', 'in_progress'], ['in_progress', 'completed']]) {
  test(`assigned doctor changes ${source} to ${target} using one transaction`, async () => {
    const db = database({ status: source });
    const result = await createRecordWorkflowService(db.pool)(doctor, id, { status: target });
    assert.deepEqual(result, { id, status: target });
    assert.equal(db.status(), target);
    assert.equal(db.calls[0].sql, 'BEGIN');
    assert.equal(db.calls.at(-1).sql, 'COMMIT');
    assert.ok(db.calls.every((call) => call.client === db.calls[0].client));
    assert.deepEqual(db.calls.find((call) => call.sql.startsWith('UPDATE')).values, [id, '7', source, target]);
  });
}

test('invalid input and patient-only callers never acquire a connection', async () => {
  let connected = false;
  const change = createRecordWorkflowService({ connect() { connected = true; throw new Error(); } });
  for (const body of [null, [], {}, { status: 'in_progress', ma_bac_si: '7' }, { status: 'completed', completed_at: 'synthetic' },
    { status: ['in_progress'] }, { status: 'draft' }, { status: 'pending' }, { status: 'cancelled' }]) {
    await assert.rejects(change(doctor, id, body), (error) => error.status === 400);
  }
  await assert.rejects(change(doctor, '1 OR TRUE', { status: 'completed' }), (error) => error.status === 400);
  await assert.rejects(change({ patient_id: '7' }, id, { status: 'completed' }), (error) => error.status === 403);
  assert.equal(connected, false);
});

test('unassigned doctor, including dual patient/staff identity, cannot mutate own record', async () => {
  for (const principal of [doctor, { ...doctor, patient_id: '11' }]) {
    const db = database({ assigned: false });
    await assert.rejects(createRecordWorkflowService(db.pool)(principal, id, { status: 'in_progress' }),
      (error) => error.status === 404 && error.code === '4001');
    assert.ok(!db.calls.some((call) => call.sql.startsWith('UPDATE')));
    assert.equal(db.calls.at(-1).sql, 'ROLLBACK');
  }
});

test('skipping, repeating, terminal and legacy states reject without a write', async () => {
  for (const [source, target] of [['draft', 'completed'], ['in_progress', 'in_progress'], ['completed', 'in_progress'],
    ['completed', 'completed'], ['pending', 'in_progress'], ['cancelled', 'completed']]) {
    const db = database({ status: source });
    await assert.rejects(createRecordWorkflowService(db.pool)(doctor, id, { status: target }),
      (error) => error.status === 409 && error.code === (source === 'completed' ? '4003' : '4009'));
    assert.equal(db.status(), source);
    assert.ok(!db.calls.some((call) => call.sql.startsWith('UPDATE')));
  }
});

test('conditional update failure rolls back instead of reporting success', async () => {
  const db = database({ updateMissing: true });
  await assert.rejects(createRecordWorkflowService(db.pool)(doctor, id, { status: 'in_progress' }),
    (error) => error.status === 409 && error.code === '4009');
  assert.equal(db.calls.at(-1).sql, 'ROLLBACK');
  assert.equal(db.status(), 'draft');
});

test('commit failure restores the old state and never returns a successful result', async () => {
  const db = database({ failCommit: true });
  await assert.rejects(createRecordWorkflowService(db.pool)(doctor, id, { status: 'in_progress' }), /commit failure/);
  assert.equal(db.status(), 'draft');
  assert.equal(db.calls.at(-1).sql, 'ROLLBACK');
});

test('competing starts or completions serialize, with exactly one successful transition', async () => {
  for (const [source, target] of [['draft', 'in_progress'], ['in_progress', 'completed']]) {
    const db = database({ status: source });
    const change = createRecordWorkflowService(db.pool);
    const results = await Promise.allSettled([change(doctor, id, { status: target }), change(doctor, id, { status: target })]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.find((result) => result.status === 'rejected').reason.status, 409);
    assert.equal(db.calls.filter((call) => call.sql.startsWith('UPDATE')).length, 1);
    assert.equal(db.status(), target);
  }
});

test('status HTTP route enforces authentication/capability and preserves the envelope', async (t) => {
  const db = database();
  const app = express();
  app.use(express.json());
  app.use('/api/v1', createClinicalRouter({
    pool: db.pool,
    authenticate(req, _res, next) {
      if (!req.headers.authorization) return next(new HttpError(401, '3003', 'User not authenticated'));
      req.auth = doctor;
      next();
    },
    authorize(action) {
      assert.equal(typeof action, 'string');
      return (req, _res, next) => {
        if (action !== 'records.write' || req.headers.authorization !== 'allowed') return next(new HttpError(403, '3101', 'Permission denied'));
        next();
      };
    },
  }));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/v1/medical-records/${id}/status`;
  const patch = (authorization, body) => fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) }, body: JSON.stringify(body) });
  assert.equal((await patch(null, { status: 'in_progress' })).status, 401);
  assert.equal((await patch('denied', { status: 'in_progress' })).status, 403);
  assert.equal((await patch('allowed', { status: 'in_progress', doctor_id: '7' })).status, 400);
  assert.equal(db.calls.length, 0);
  const started = await patch('allowed', { status: 'in_progress' });
  assert.equal(started.status, 200);
  assert.deepEqual(await started.json(), { code: '1000', message: 'OK', data: { id, status: 'in_progress' } });
  const completed = await patch('allowed', { status: 'completed' });
  assert.equal(completed.status, 200);
  const repeated = await patch('allowed', { status: 'completed' });
  assert.equal(repeated.status, 409);
  assert.deepEqual(await repeated.json(), { code: '4003', message: 'Medical record already completed', data: null });
});
