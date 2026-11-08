// Owner-authorized operator task: add one existing role/permission link only.
// Default is READ ONLY preview. Never run this from startup or test hooks.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { readConfig } = require('../src/config/env');
const { readAuthConfig } = require('../src/config/auth');
const { createDatabasePool } = require('../src/database/pool');
const { parseSchema, compareColumns } = require('./schema-contract');
const { COLUMNS } = require('./verify-database');

const ACTIONS = Object.freeze(['patients.read', 'records.read', 'prescriptions.read', 'labs.read', 'uas.read', 'uas.write', 'media.read', 'media.write', 'lesions.write']);
const PERMISSION = 'manage_medical_records';
const GUARD = `SELECT
  EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE oid = 'public.vaitroquyenhan'::regclass
    AND relkind = 'r' AND NOT relispartition AND NOT relrowsecurity AND NOT relforcerowsecurity) AS plain_table,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'public.vaitroquyenhan'::regclass
    AND NOT tgisinternal AND tgenabled <> 'D') AS no_custom_triggers,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_rewrite WHERE ev_class = 'public.vaitroquyenhan'::regclass) AS no_rules,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid = 'public.vaitroquyenhan'::regclass
    AND contype = 'p' AND pg_catalog.pg_get_constraintdef(oid) = 'PRIMARY KEY (ma_vai_tro, ma_quyen_han)') AS expected_key,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = 'public.vaitroquyenhan'::regclass AND a.attname = 'thoi_diem_gan'
    AND pg_catalog.pg_get_expr(d.adbin, d.adrelid) = 'CURRENT_TIMESTAMP') AS safe_timestamp_default`;
const ROLE = 'SELECT ma_vai_tro::text AS id, ten_vai_tro AS name FROM public.vaitro WHERE ma_vai_tro = $1';
const STAFF = `SELECT EXISTS (SELECT 1 FROM public.taikhoan a JOIN public.nhanvien n ON n.ma_nhan_vien = a.ma_nguoi
  WHERE a.ma_vai_tro = $1) AS has_staff_accounts`;
const FIND_PERMISSION = 'SELECT ma_quyen_han::text AS id FROM public.quyenhan WHERE ten_quyen_han = $1';
const LINKS = 'SELECT ma_quyen_han::text AS id FROM public.vaitroquyenhan WHERE ma_vai_tro = $1 ORDER BY ma_quyen_han';
const INSERT = `INSERT INTO public.vaitroquyenhan (ma_vai_tro, ma_quyen_han, ma_nguoi_gan)
  VALUES ($1, $2, NULL) ON CONFLICT (ma_vai_tro, ma_quyen_han) DO NOTHING
  RETURNING ma_quyen_han::text AS id`;

async function enablePatientAccess({ apply = false, loadConfig = readConfig, loadAuth = readAuthConfig,
  makePool = createDatabasePool, loadSchema = () => readFileSync(resolve(__dirname, '../../doc/mayday.sql'), 'utf8') } = {}) {
  let pool, client, open = false, discard = false, commitAttempted = false, result;
  try {
    const config = loadConfig(), auth = loadAuth();
    if (!config.databaseEnabled || !auth.jwtSecret || !auth.patientSignupRoleId) throw new Error('Configuration unavailable');
    // This tool is deliberately narrower than arbitrary RBAC administration.
    if (!ACTIONS.every((action) => auth.actionPermissions[action]?.length === 1 && auth.actionPermissions[action][0] === PERMISSION)) throw new Error('Permission mapping changed');
    const baseline = parseSchema(loadSchema());
    pool = makePool(config); client = await pool.connect();
    await client.query(apply ? 'BEGIN ISOLATION LEVEL READ COMMITTED' : 'BEGIN READ ONLY'); open = true;
    const mode = await client.query("SELECT current_setting('transaction_read_only') AS mode");
    if (mode.rows[0]?.mode !== (apply ? 'off' : 'on')) throw new Error('Unexpected transaction mode');
    if (compareColumns(baseline, (await client.query(COLUMNS, ['public'])).rows).length) throw new Error('Schema columns changed');
    const guard = (await client.query(GUARD)).rows[0];
    if (!guard || !['plain_table', 'no_custom_triggers', 'no_rules', 'expected_key', 'safe_timestamp_default'].every((key) => guard[key] === true)) throw new Error('Insert side-effect guard failed');
    // FOR UPDATE here only locks this existing role; it never edits a row.
    // It serializes controlled grant/role assignment changes during apply.
    const role = (await client.query(ROLE + (apply ? ' FOR UPDATE' : ''), [auth.patientSignupRoleId])).rows[0];
    if (!role || role.name !== 'benh_nhan') throw new Error('Unexpected configured patient role');
    if ((await client.query(STAFF, [role.id])).rows[0]?.has_staff_accounts !== false) throw new Error('Patient role includes staff');
    const permission = (await client.query(FIND_PERMISSION + (apply ? ' FOR SHARE' : ''), [PERMISSION])).rows[0];
    if (!permission) throw new Error('Required existing permission unavailable');
    const before = (await client.query(LINKS, [role.id])).rows.map((row) => row.id);
    const missing = !before.includes(permission.id);
    let inserted = 0;
    if (apply && missing) {
      const created = await client.query(INSERT, [role.id, permission.id]);
      if (created.rows.length > 1 || created.rows.some((row) => row.id !== permission.id)) throw new Error('Unexpected insert result');
      inserted = created.rows.length;
    }
    if (apply) {
      const after = (await client.query(LINKS, [role.id])).rows.map((row) => row.id);
      if (!after.includes(permission.id) || !before.every((id) => after.includes(id)) || after.some((id) => !before.includes(id) && id !== permission.id)) throw new Error('Grant readback differs');
      commitAttempted = true;
      await client.query('COMMIT'); open = false;
    } else { await client.query('ROLLBACK'); open = false; }
    result = { ok: true, mode: apply ? 'applied' : 'preview', roleId: role.id, permission: PERMISSION,
      requiredActions: ACTIONS, missingLinksBefore: missing ? 1 : 0, inserted, existingLinksPreserved: true };
  } catch {
    result = { ok: false, reason: commitAttempted ? 'commit_outcome_unknown_readback_required' : 'patient_access_check_failed' };
  } finally {
    if (open) { try { await client.query('ROLLBACK'); } catch { discard = true; } }
    try { client?.release(discard); } catch { result = { ...result, ok: false, reason: 'cleanup_failed_readback_required' }; }
    try { await pool?.end(); } catch { result = { ...result, ok: false, reason: 'cleanup_failed_readback_required' }; }
  }
  return result;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--apply')) {
    console.error('Use no arguments for READ ONLY preview, or --apply for the authorized insert.'); process.exitCode = 1;
  } else enablePatientAccess({ apply: args[0] === '--apply' }).then((result) => {
    console.log(JSON.stringify(result)); if (!result.ok) process.exitCode = 1;
  }).catch(() => { console.error('Patient access operation failed'); process.exitCode = 1; });
}
module.exports = { enablePatientAccess, ACTIONS, GUARD, ROLE, STAFF, FIND_PERMISSION, LINKS, INSERT };
