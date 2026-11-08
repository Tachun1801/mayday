const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { DEFAULT_ACTION_PERMISSIONS } = require('../src/config/auth');
const { parseSchema } = require('../scripts/schema-contract');
const { COLUMNS } = require('../scripts/verify-database');
const { enablePatientAccess, GUARD, ROLE, STAFF, FIND_PERMISSION, LINKS, INSERT } = require('../scripts/enable-patient-access');
const ddl = readFileSync(resolve(__dirname, '../../doc/mayday.sql'), 'utf8');

function fixture({ existing = false, staff = false, role = 'benh_nhan', permission = true, guard = {}, drift = false, fail = '', rollbackFail = false, auth = {} } = {}) {
  const calls = [];
  let committed = existing ? ['6', '99'] : ['99'], staged = null;
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql === fail || (sql === 'ROLLBACK' && rollbackFail)) throw new Error('synthetic private endpoint/credential');
      if (sql.startsWith('SELECT current_setting')) return { rows: [{ mode: calls[0].sql === 'BEGIN READ ONLY' ? 'on' : 'off' }] };
      if (sql === COLUMNS) return { rows: drift ? [] : parseSchema(ddl) };
      if (sql === GUARD) return { rows: [{ plain_table: true, no_custom_triggers: true, no_rules: true, expected_key: true, safe_timestamp_default: true, ...guard }] };
      if (sql.startsWith(ROLE)) { assert.deepEqual(values, ['4']); return { rows: [{ id: '4', name: role }] }; }
      if (sql === STAFF) return { rows: [{ has_staff_accounts: staff }] };
      if (sql.startsWith(FIND_PERMISSION)) { assert.deepEqual(values, ['manage_medical_records']); return { rows: permission ? [{ id: '6' }] : [] }; }
      if (sql === LINKS) return { rows: (staged || committed).map((id) => ({ id })) };
      if (sql === INSERT) { assert.deepEqual(values, ['4', '6']); staged = [...committed, '6']; return { rows: [{ id: '6' }] }; }
      if (sql === 'COMMIT') { if (staged) committed = staged; staged = null; }
      if (sql === 'ROLLBACK') staged = null;
      return { rows: [] };
    }, release(discard) { calls.push({ release: discard }); },
  };
  return { calls, grants: () => committed, options: {
    loadConfig: () => ({ databaseEnabled: true }),
    loadAuth: () => ({ jwtSecret: 'synthetic-secret', patientSignupRoleId: '4', actionPermissions: DEFAULT_ACTION_PERMISSIONS, ...auth }),
    makePool: () => ({ async connect() { return client; }, async end() { calls.push({ end: true }); } }), loadSchema: () => ddl,
  } };
}

test('patient-access default preview is read-only, checks side effects, and never inserts', async () => {
  const db = fixture(), result = await enablePatientAccess(db.options);
  assert.equal(result.ok, true); assert.equal(result.mode, 'preview'); assert.equal(result.inserted, 0); assert.equal(result.missingLinksBefore, 1);
  assert.equal(db.calls[0].sql, 'BEGIN READ ONLY'); assert.equal(db.calls.at(-3).sql, 'ROLLBACK');
  assert.ok(!db.calls.some(({ sql }) => sql?.startsWith('INSERT') || sql?.includes('FOR UPDATE')));
  assert.deepEqual(db.grants(), ['99']); assert.deepEqual(db.calls.at(-2), { release: false }); assert.deepEqual(db.calls.at(-1), { end: true });
});

test('patient-access apply only inserts the missing existing permission link and preserves unrelated grants', async () => {
  const db = fixture(), result = await enablePatientAccess({ ...db.options, apply: true });
  assert.equal(result.ok, true); assert.equal(result.inserted, 1); assert.equal(result.existingLinksPreserved, true);
  assert.deepEqual(db.grants(), ['99', '6']);
  assert.equal(db.calls[0].sql, 'BEGIN ISOLATION LEVEL READ COMMITTED');
  assert.ok(db.calls.some(({ sql }) => sql === ROLE + ' FOR UPDATE'));
  const mutation = db.calls.filter(({ sql }) => /^(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|MERGE|GRANT|REVOKE)/.test(sql || ''));
  assert.deepEqual(mutation.map(({ sql }) => sql), [INSERT]);
  assert.match(INSERT, /ON CONFLICT \(ma_vai_tro, ma_quyen_han\) DO NOTHING/);
  assert.doesNotMatch(INSERT, /DO UPDATE|SET |thoi_diem_gan/);
  assert.ok(db.calls.findIndex(({ sql }) => sql === GUARD) < db.calls.findIndex(({ sql }) => sql === INSERT));
  assert.equal(db.calls.at(-3).sql, 'COMMIT');
});

test('patient-access repeat apply skips an existing link, without edits or timestamp refresh', async () => {
  const db = fixture({ existing: true }), result = await enablePatientAccess({ ...db.options, apply: true });
  assert.equal(result.ok, true); assert.equal(result.inserted, 0); assert.equal(result.missingLinksBefore, 0);
  assert.ok(!db.calls.some(({ sql }) => sql === INSERT)); assert.deepEqual(db.grants(), ['6', '99']);
});

test('patient-access refuses drift, custom triggers/rules/defaults, wrong role, staff members and absent permission before insert', async () => {
  for (const options of [{ drift: true }, { guard: { no_custom_triggers: false } }, { guard: { no_rules: false } },
    { guard: { safe_timestamp_default: false } }, { guard: { expected_key: false } }, { guard: { plain_table: false } },
    { role: 'admin' }, { staff: true }, { permission: false }]) {
    const db = fixture(options), result = await enablePatientAccess({ ...db.options, apply: true });
    assert.equal(result.ok, false); assert.ok(!db.calls.some(({ sql }) => sql === INSERT)); assert.deepEqual(db.grants(), ['99']);
    assert.equal(db.calls.at(-3).sql, 'ROLLBACK'); assert.deepEqual(db.calls.at(-2), { release: false });
  }
  const unmapped = fixture({ auth: { actionPermissions: {} } });
  assert.equal((await enablePatientAccess({ ...unmapped.options, apply: true })).ok, false); assert.equal(unmapped.calls.length, 0);
});

test('patient-access rollback, unknown COMMIT and cleanup failures never expose internals or retry', async () => {
  for (const options of [{ fail: INSERT }, { fail: 'COMMIT' }, { fail: INSERT, rollbackFail: true }]) {
    const db = fixture(options), result = await enablePatientAccess({ ...db.options, apply: true });
    assert.equal(result.ok, false); assert.doesNotMatch(JSON.stringify(result), /synthetic|credential|endpoint/);
    assert.equal(result.reason, options.fail === 'COMMIT' ? 'commit_outcome_unknown_readback_required' : 'patient_access_check_failed');
    assert.equal(db.calls.filter(({ sql }) => sql === INSERT).length, 1);
    assert.deepEqual(db.calls.at(-2), { release: Boolean(options.rollbackFail) }); assert.deepEqual(db.calls.at(-1), { end: true });
    assert.deepEqual(db.grants(), ['99']);
  }
});
