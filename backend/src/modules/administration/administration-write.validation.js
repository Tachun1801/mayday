const { HttpError } = require('../../shared/errors');
function invalid() { return new HttpError(400, '2003', 'Invalid administration request'); }
function object(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw invalid();
  return value;
}
function text(value, max, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.includes('\0') || [...value].length > max || (required && !value.trim())) throw invalid();
  return value.trim();
}
function identifier(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) throw invalid();
  return value;
}
function staffInput(body) {
  object(body, ['username', 'password', 'full_name', 'phone', 'role_id']);
  const username = text(body.username, 100, true), fullName = text(body.full_name, 150, true);
  if (typeof body.password !== 'string' || body.password.includes('\0') || Buffer.byteLength(body.password) < 12 || Buffer.byteLength(body.password) > 72 || typeof body.phone !== 'string' || !/^\d{10}$/.test(body.phone)) throw invalid();
  return { username, password: body.password, full_name: fullName, phone: body.phone, role_id: identifier(body.role_id) };
}
function accountPatch(body) {
  object(body, ['full_name', 'gender', 'role_id', 'is_active']);
  if (!Object.keys(body).length) throw invalid();
  const result = {};
  if (Object.hasOwn(body, 'full_name')) result.full_name = text(body.full_name, 150, true);
  if (Object.hasOwn(body, 'gender')) { if (body.gender !== null && !['Nam', 'Nu'].includes(body.gender)) throw invalid(); result.gender = body.gender; }
  if (Object.hasOwn(body, 'role_id')) result.role_id = identifier(body.role_id);
  if (Object.hasOwn(body, 'is_active')) { if (typeof body.is_active !== 'boolean') throw invalid(); result.is_active = body.is_active; }
  return result;
}
module.exports = { invalid, object, text, identifier, staffInput, accountPatch };
