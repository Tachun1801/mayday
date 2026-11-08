const bcrypt = require('bcryptjs');
const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { validateSignup } = require('./signup.validation');
const { signupRole, insertPatientAccount } = require('./signup.repository');
function createSignupService(pool, roleId, { hashPassword = (password) => bcrypt.hash(password, 12) } = {}) {
  if (typeof roleId !== 'string' || !/^[1-9]\d{0,18}$/.test(roleId) || BigInt(roleId) > 9223372036854775807n) throw new Error('Patient registration requires a configured role identifier');
  return async (body) => {
    const input = validateSignup(body);
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    const hash = await hashPassword(input.password);
    try {
      return await withTransaction(pool, async (client) => {
        if (!await signupRole(client, roleId)) throw new Error('Patient registration role unavailable');
        // Always create a fresh person/subtype. Shared phone numbers never
        // link to existing clinical identities or authenticate another patient.
        return insertPatientAccount(client, roleId, input, hash);
      });
    } catch (error) {
      if (error.code === '23505') throw new HttpError(409, '2003', 'Registration conflicts with existing data');
      if (['23503', '23514', '23502', '22001'].includes(error.code)) throw new HttpError(400, '2003', 'Invalid registration request');
      throw error;
    }
  };
}
module.exports = { createSignupService };
