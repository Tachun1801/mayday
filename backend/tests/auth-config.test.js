const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readAuthConfig } = require('../src/config/auth');
const absent = '/tmp/mayday-no-auth-config';

test('authentication configuration requires a long secret and validates permission mapping', () => {
  assert.throws(() => readAuthConfig({ JWT_SECRET: 'short' }, absent), /at least 32/);
  const config = readAuthConfig({ JWT_SECRET: 'fixture-secret-'.repeat(4) }, absent);
  assert.equal(config.actionPermissions['patients.read'][0], 'manage_medical_records');
  for (const value of ['[]', 'null', '{"patients.read":[]}', '{"patients.read":[1]}', 'invalid']) {
    assert.throws(() => readAuthConfig({ RBAC_ACTION_PERMISSIONS: value }, absent), /RBAC_ACTION_PERMISSIONS/);
  }
  assert.deepEqual(readAuthConfig({ RBAC_ACTION_PERMISSIONS: '{"patients.read":["custom_permission"]}' }, absent).actionPermissions,
    { 'patients.read': ['custom_permission'] });
});

test('patient signup role is opt-in and admin action names match the verified catalogue', () => {
  const config = readAuthConfig({ PATIENT_SIGNUP_ROLE_ID: '4' }, absent);
  assert.equal(config.patientSignupRoleId, '4'); assert.deepEqual(config.actionPermissions['accounts.write'], ['manage_users_v2']);
  assert.equal(readAuthConfig({}, absent).patientSignupRoleId, undefined);
  for (const value of ['0', '4;DROP', '9223372036854775808']) assert.throws(() => readAuthConfig({ PATIENT_SIGNUP_ROLE_ID: value }, absent), /PATIENT_SIGNUP_ROLE_ID/);
});
