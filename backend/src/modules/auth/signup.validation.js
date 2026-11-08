const { HttpError } = require('../../shared/errors');
const invalid = () => new HttpError(400, '2003', 'Invalid registration request');
function validateSignup(body, today = new Date().toISOString().slice(0, 10)) {
  const allowed = ['username', 'password', 'full_name', 'phone', 'birth_date', 'gender'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key))) throw invalid();
  for (const [key, max] of [['username', 100], ['full_name', 150]]) if (typeof body[key] !== 'string' || !body[key].trim() || [...body[key].trim()].length > max || /[\r\n\0]/.test(body[key])) throw invalid();
  if (typeof body.phone !== 'string' || !/^\d{10}$/.test(body.phone) || typeof body.password !== 'string' || body.password.includes('\0') || Buffer.byteLength(body.password) < 12 || Buffer.byteLength(body.password) > 72) throw invalid();
  if (body.gender != null && !['Nam', 'Nu'].includes(body.gender)) throw invalid();
  const birth = body.birth_date ?? null;
  if (birth !== null) {
    const parsed = typeof birth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birth) && !birth.startsWith('0000') ? new Date(`${birth}T00:00:00Z`) : null;
    if (!parsed || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== birth || birth > today) throw invalid();
  }
  return { username: body.username.trim(), full_name: body.full_name.trim(), phone: body.phone, password: body.password, birth_date: birth, gender: body.gender ?? null };
}
module.exports = { validateSignup };
