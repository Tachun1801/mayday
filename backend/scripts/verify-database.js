const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { readConfig } = require('../src/config/env');
const { readAuthConfig, DEFAULT_ACTION_PERMISSIONS } = require('../src/config/auth');
const { createDatabasePool } = require('../src/database/pool');
const { parseSchema, compareColumns } = require('./schema-contract');

const COLUMNS = `SELECT c.relname AS table_name, a.attname AS column_name,
  row_number() OVER (PARTITION BY c.oid ORDER BY a.attnum)::integer AS position,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS not_null,
  (a.attgenerated <> '') AS generated, (a.attidentity <> '') AS identity,
  (d.oid IS NOT NULL AND a.attgenerated = '' AND a.attidentity = '') AS has_default
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE n.nspname = $1 AND c.relkind IN ('r', 'p') AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY c.relname, a.attnum`;
const PERMISSIONS = 'SELECT ten_quyen_han AS name FROM public.quyenhan ORDER BY ten_quyen_han';
const GRANTS = `SELECT v.ma_vai_tro::text AS role_id, v.ten_vai_tro AS role_name, q.ten_quyen_han AS permission
  FROM public.vaitro v LEFT JOIN public.vaitroquyenhan vq ON vq.ma_vai_tro = v.ma_vai_tro
  LEFT JOIN public.quyenhan q ON q.ma_quyen_han = vq.ma_quyen_han ORDER BY v.ma_vai_tro`;

async function verifyDatabase({ loadConfig = readConfig, loadAuth = readAuthConfig, makePool = createDatabasePool,
  loadSchema = () => readFileSync(resolve(__dirname, '../../doc/mayday.sql'), 'utf8') } = {}) {
  let pool, client, open = false, discard = false, result;
  try {
    const config = loadConfig();
    if (!config.databaseEnabled) return { ok: false, reason: 'database_disabled' };
    const auth = loadAuth(), baseline = parseSchema(loadSchema());
    pool = makePool(config);
    client = await pool.connect();
    await client.query('BEGIN READ ONLY'); open = true;
    const mode = await client.query("SELECT current_setting('transaction_read_only') AS mode");
    if (mode.rows[0]?.mode !== 'on') throw new Error('Read-only verification failed');
    const columns = await client.query(COLUMNS, ['public']);
    const differences = compareColumns(baseline, columns.rows);
    // Avoid dependent catalogue queries when identity/permission storage drifts.
    if (differences.length) result = { ok: false, reason: 'schema_columns_differ', differences };
    else {
      const permissions = new Set((await client.query(PERMISSIONS)).rows.map((row) => row.name));
      const roles = new Map(), roleNames = new Map();
      for (const row of (await client.query(GRANTS)).rows) {
        if (!roles.has(row.role_id)) roles.set(row.role_id, new Set());
        roleNames.set(row.role_id, row.role_name || null);
        if (row.permission) roles.get(row.role_id).add(row.permission);
      }
      const mappings = Object.entries(auth.actionPermissions);
      const unmappedActions = Object.keys(DEFAULT_ACTION_PERMISSIONS).filter((action) => !auth.actionPermissions[action]?.length);
      const missingPermissions = [...new Set(mappings.flatMap(([, names]) => names).filter((name) => !permissions.has(name)))].sort();
      const actionsWithoutGrantedRole = mappings.filter(([, names]) => ![...roles.values()].some((grants) => names.every((name) => grants.has(name)))).map(([action]) => action);
      const patientSignupRoleExists = auth.patientSignupRoleId ? roles.has(auth.patientSignupRoleId) : null;
      const roleCapabilities = [...roles].map(([roleId, grants]) => ({ roleId, roleName: roleNames.get(roleId),
        actions: mappings.filter(([, names]) => names.every((name) => grants.has(name))).map(([action]) => action) }));
      const patientActionsWithoutGrant = auth.patientSignupRoleId ? ['patients.read', 'records.read', 'prescriptions.read', 'labs.read', 'uas.read', 'uas.write', 'media.read', 'media.write', 'lesions.write'].filter((action) => {
        const names = auth.actionPermissions[action];
        return !names?.length || !names.every((name) => roles.get(auth.patientSignupRoleId)?.has(name));
      }) : [];
      result = { ok: Boolean(auth.jwtSecret) && !unmappedActions.length && !missingPermissions.length && !actionsWithoutGrantedRole.length && patientSignupRoleExists !== false && !patientActionsWithoutGrant.length,
        readOnly: true, columnsMatch: true, tables: new Set(baseline.map((column) => column.table_name)).size, columns: baseline.length,
        jwtConfigured: Boolean(auth.jwtSecret), unmappedActions, missingPermissions, actionsWithoutGrantedRole, roleCapabilities, patientSignupRoleExists, patientActionsWithoutGrant,
        limits: 'Column types/order/nullability/generated/identity/default presence only; constraint/index/trigger/expression semantics and runtime write privileges are unverified. Role grants do not prove staff/assignment eligibility.' };
    }
    await client.query('ROLLBACK'); open = false;
  } catch {
    result = { ok: false, reason: 'verification_failed' };
  } finally {
    if (open) { try { await client.query('ROLLBACK'); } catch { discard = true; } }
    try { client?.release(discard); } catch { result = { ok: false, reason: 'cleanup_failed' }; }
    try { await pool?.end(); } catch { result = { ok: false, reason: 'cleanup_failed' }; }
  }
  return result;
}

if (require.main === module) {
  verifyDatabase().then((result) => { console.log(JSON.stringify(result)); if (!result.ok) process.exitCode = 1; })
    .catch(() => { console.error('Database verification failed'); process.exitCode = 1; });
}
module.exports = { verifyDatabase, COLUMNS, PERMISSIONS, GRANTS };
