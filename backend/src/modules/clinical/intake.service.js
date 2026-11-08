const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const { validateIntake } = require('./intake.validation');
const { insertIntake } = require('./intake.repository');
function createIntakeService(pool) {
  return async function createIntake(principal, body) {
    if (!principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
    const staffId = identifier(String(principal.staff_id));
    const input = validateIntake(body);
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    try {
      return await withTransaction(pool, (client) => insertIntake(client, staffId, input));
    } catch (error) {
      if (['23503', '23514', '22007', '22008', '22001'].includes(error.code)) {
        // Internal SQL errors are intentionally not retained in an exposed HTTP error.
        throw new HttpError(400, '2003', 'Invalid intake request');
      }
      throw error;
    }
  };
}
module.exports = { createIntakeService };
