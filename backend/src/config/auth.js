const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');

// Action contracts use configured permission names, never role-name bypasses.
// Administration name reconciled with the READ ONLY live catalogue on 2026-11-07.
const DEFAULT_ACTION_PERMISSIONS = Object.freeze({
  'patients.read': ['manage_medical_records'],
  'patients.write': ['manage_medical_records'],
  'records.write': ['manage_medical_records'],
  'records.read': ['manage_medical_records'],
  'uas.read': ['manage_medical_records'],
  'uas.write': ['manage_medical_records'],
  'prescriptions.read': ['manage_medical_records'],
  'labs.read': ['manage_medical_records'],
  'facilities.read': ['manage_clinical'],
  'facilities.write': ['manage_clinical'],
  'catalogs.read': ['manage_clinical'],
  'catalogs.write': ['manage_clinical'],
  'media.read': ['manage_medical_records'],
  'media.write': ['manage_medical_records'],
  'lesions.write': ['manage_medical_records'],
  'accounts.read': ['manage_users_v2'],
  'accounts.write': ['manage_users_v2'],
  'permissions.read': ['manage_users_v2'],
  'permissions.write': ['manage_users_v2'],
});

function readAuthConfig(env = process.env, filePath = resolve(__dirname, '../../.env')) {
  let local = {};
  try {
    const content = readFileSync(filePath, 'utf8').split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('#')).join('\n').trim();
    if (!/^postgres(?:ql)?:\/\//.test(content)) local = parseEnv(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Parser errors can include private configuration text.
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Cannot read authentication configuration');
    }
  }
  const values = { ...local, ...env };
  const jwtSecret = values.JWT_SECRET || '';
  if (jwtSecret && Buffer.byteLength(jwtSecret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes');
  let actionPermissions = DEFAULT_ACTION_PERMISSIONS;
  if (values.RBAC_ACTION_PERMISSIONS) {
    try {
      const mapping = JSON.parse(values.RBAC_ACTION_PERMISSIONS);
      if (!mapping || Array.isArray(mapping) || typeof mapping !== 'object') throw new Error();
      for (const [action, names] of Object.entries(mapping)) {
        if (!/^[a-z][a-z.-]*$/.test(action) || !Array.isArray(names) || names.length === 0 ||
          names.some((name) => typeof name !== 'string' || !name.trim() || name.length > 100)) throw new Error();
      }
      actionPermissions = mapping;
    } catch {
      throw new Error('RBAC_ACTION_PERMISSIONS must be an object of action names to nonempty permission arrays');
    }
  }
  const patientSignupRoleId = values.PATIENT_SIGNUP_ROLE_ID || undefined;
  if (patientSignupRoleId && (!/^[1-9]\d{0,18}$/.test(patientSignupRoleId) || BigInt(patientSignupRoleId) > 9223372036854775807n)) throw new Error('PATIENT_SIGNUP_ROLE_ID must be a positive bigint identifier');
  return { jwtSecret, actionPermissions, patientSignupRoleId };
}

module.exports = { readAuthConfig, DEFAULT_ACTION_PERMISSIONS };
