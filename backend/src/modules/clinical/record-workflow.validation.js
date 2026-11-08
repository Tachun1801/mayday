const { HttpError } = require('../../shared/errors');

function validateRecordStatus(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !Object.hasOwn(body, 'status')) {
    throw new HttpError(400, '2003', 'Expected only status');
  }
  if (!['in_progress', 'completed'].includes(body.status)) {
    throw new HttpError(400, '4009', 'Invalid medical record status');
  }
  return body.status;
}

module.exports = { validateRecordStatus };
