const { HttpError } = require('../../shared/errors');

function identifier(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) {
    throw new HttpError(400, '2003', 'Invalid identifier');
  }
  return value;
}

function pagination(query) {
  function positive(value, fallback, max) {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
      throw new HttpError(400, '2003', 'Invalid pagination');
    }
    return Number(value);
  }
  const page = positive(query.page, 1, 1000000);
  const limit = positive(query.limit, 20, 100);
  return { page, limit, offset: (page - 1) * limit };
}

function keyword(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 100) throw new HttpError(400, '2003', 'Invalid keyword');
  return value.trim();
}

module.exports = { identifier, pagination, keyword };
