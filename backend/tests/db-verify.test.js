const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseSchema, compareColumns } = require('../scripts/schema-contract');
const { verifyDatabase, COLUMNS, PERMISSIONS, GRANTS } = require('../scripts/verify-database');
const { DEFAULT_ACTION_PERMISSIONS } = require('../src/config/auth');
const dump = readFileSync(resolve(__dirname, '../../doc/mayday.sql'), 'utf8');
const baseline = parseSchema(dump);

test('local schema baseline parses all 44 tables/507 columns and respects generated/identity declarations', () => {
  assert.equal(new Set(baseline.map((column) => column.table_name)).size, 44);
  assert.equal(baseline.length, 507);
  const column = (table, name) => baseline.find((item) => item.table_name === table && item.column_name === name);
  assert.equal(column('hosobenhan', 'ma_ho_so').identity, true);
  assert.equal(column('hosobenhan', 'ma_subtype_cap').generated, true);
  assert.equal(column('nhatkyuashangngay', 'diem_uas_ngay').generated, true);
  assert.equal(column('hosobenhan', 'trang_thai').has_default, true);
  assert.equal(column('ketquacanlamsangcap', 'nlr').type, 'numeric');
  assert.deepEqual(compareColumns(baseline, structuredClone(baseline)), []);
  assert.throws(() => parseSchema('COPY synthetic data'));
});

test('schema comparison detects missing/extra columns and unsafe changes without exposing values', () => {
  const expected = baseline.slice(0, 2), changed = structuredClone(expected);
  changed[0].type = 'integer'; changed[0].not_null = !changed[0].not_null; changed[0].identity = !changed[0].identity;
  changed[1] = { ...changed[1], column_name: 'synthetic_extra' };
  const differences = compareColumns(expected, changed);
  assert.deepEqual(differences[0].mismatch, ['type', 'not_null', 'identity']);
  assert.deepEqual(differences[1].mismatch, ['missing']);
  assert.deepEqual(differences[2].mismatch, ['unexpected']);
});

function fixture({ schema = baseline, grants, fail = '', mode = 'on', rollbackFail = false, auth = {} } = {}) {
  const calls = [];
  const defaultNames = [...new Set(Object.values(DEFAULT_ACTION_PERMISSIONS).flat())];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql === fail || (sql === 'ROLLBACK' && rollbackFail)) throw new Error('synthetic private endpoint/credential');
      if (sql.startsWith('SELECT current_setting')) return { rows: [{ mode }] };
      if (sql === COLUMNS) return { rows: schema };
      if (sql === PERMISSIONS) return { rows: defaultNames.map((name) => ({ name })) };
      if (sql === GRANTS) return { rows: grants || defaultNames.map((permission) => ({ role_id: '4', permission })) };
      return { rows: [] };
    }, release(discard) { calls.push({ release: discard }); },
  };
  return { calls, options: {
    loadConfig: () => ({ databaseEnabled: true }), loadAuth: () => ({ jwtSecret: 'synthetic-private-secret', actionPermissions: DEFAULT_ACTION_PERMISSIONS, patientSignupRoleId: '4', ...auth }),
    makePool: () => ({ async connect() { return client; }, async end() { calls.push({ end: true }); } }), loadSchema: () => dump,
  } };
}

test('database verification is opt-in, read-only and queries only metadata/role catalogue', async () => {
  const { calls, options } = fixture();
  const result = await verifyDatabase(options);
  assert.equal(result.ok, true); assert.equal(result.columns, 507); assert.equal(result.tables, 44);
  assert.doesNotMatch(JSON.stringify(result), /synthetic-private-secret|role_id/);
  assert.equal(calls[0].sql, 'BEGIN READ ONLY');
  assert.deepEqual(calls.find(({ sql }) => sql === COLUMNS).values, ['public']);
  assert.equal(calls.at(-3).sql, 'ROLLBACK'); assert.deepEqual(calls.at(-2), { release: false }); assert.deepEqual(calls.at(-1), { end: true });
  assert.ok(calls.filter(({ sql }) => sql).every(({ sql }) => /^(SELECT|BEGIN READ ONLY|ROLLBACK)/.test(sql)));
  for (const sql of [COLUMNS, PERMISSIONS, GRANTS]) assert.doesNotMatch(sql, /public\.(nguoi|taikhoan|benhnhan|hosobenhan)|INSERT|UPDATE|DELETE|ALTER|DROP|CREATE/);
  assert.deepEqual(await verifyDatabase({ loadConfig: () => ({ databaseEnabled: false }), makePool: () => assert.fail() }), { ok: false, reason: 'database_disabled' });
});

test('verification detects role gaps, incomplete action overrides and missing signup role', async () => {
  const missingGrants = await verifyDatabase(fixture({ grants: [{ role_id: '4', permission: null }] }).options);
  assert.equal(missingGrants.ok, false); assert.ok(missingGrants.actionsWithoutGrantedRole.includes('records.write'));
  assert.ok(missingGrants.patientActionsWithoutGrant.includes('uas.write'));
  for (const action of ['patients.read', 'records.read', 'prescriptions.read', 'labs.read', 'uas.read']) assert.ok(missingGrants.patientActionsWithoutGrant.includes(action));
  const incomplete = await verifyDatabase(fixture({ auth: { actionPermissions: { 'records.read': ['synthetic-missing'] }, patientSignupRoleId: '999' } }).options);
  assert.equal(incomplete.patientSignupRoleExists, false); assert.ok(incomplete.unmappedActions.includes('patients.write'));
  assert.deepEqual(incomplete.missingPermissions, ['synthetic-missing']);
});

test('schema drift skips dependent role reads and errors/rollback cleanup stay private', async () => {
  const drift = fixture({ schema: baseline.slice(1) });
  const result = await verifyDatabase(drift.options);
  assert.equal(result.reason, 'schema_columns_differ');
  assert.ok(!drift.calls.some(({ sql }) => sql === PERMISSIONS || sql === GRANTS));
  for (const options of [{ fail: COLUMNS }, { fail: COLUMNS, rollbackFail: true }, { mode: 'off' }]) {
    const db = fixture(options), error = await verifyDatabase(db.options);
    assert.deepEqual(error, { ok: false, reason: 'verification_failed' });
    assert.deepEqual(db.calls.at(-2), { release: Boolean(options.rollbackFail) });
    assert.deepEqual(db.calls.at(-1), { end: true });
  }
});
