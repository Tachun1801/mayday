const { invalid, object, text, existingIntake } = require('./clinical-write.validation');
function contact(body) {
  object(body, ['username', 'phone']);
  const username = text(body.username, 100, true).trim();
  if (typeof body.phone !== 'string' || !/^\d{10}$/.test(body.phone)) throw invalid();
  return { username, phone: body.phone };
}
function intake(body) {
  object(body, ['username', 'phone', 'record', 'visit']);
  return { ...contact({ username: body.username, phone: body.phone }), ...existingIntake({ record: body.record, visit: body.visit }) };
}
module.exports = { contact, intake };
