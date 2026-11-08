const { HttpError } = require('../../shared/errors');
const fields = require('./clinical-fields');
const { identifier } = require('./clinical.validation');
function invalid() { return new HttpError(400, '2003', 'Invalid clinical request'); }
function object(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw invalid();
  return value;
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) throw invalid();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw invalid();
  return value;
}
function text(value, max = 8000, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.includes('\0') || [...value].length > max || (required && !value.trim())) throw invalid();
  return value;
}
function patch(table, input, allowEmpty = false) {
  const definitions = fields[table];
  if (!definitions) throw invalid();
  object(input, Object.keys(definitions));
  if (!allowEmpty && !Object.keys(input).length) throw invalid();
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    const rule = definitions[key];
    if (value === null) { result[key] = null; continue; }
    if (rule.options && !rule.options.includes(value)) throw invalid();
    if (rule.type === 'boolean') { if (typeof value !== 'boolean') throw invalid(); }
    else if (rule.type === 'integer') {
      if (!Number.isInteger(value) || value < rule.min || value > rule.max) throw invalid();
    } else if (rule.type === 'decimal') {
      // Require a decimal string, never binary float conversion or exponent/NaN.
      if (typeof value !== 'string' || value.length > 80 || !/^-?\d+(?:\.\d+)?$/.test(value)) throw invalid();
      const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
      if (rule.scale !== undefined && (fraction.length > rule.scale || whole.replace(/^0+/, '').length > rule.precision - rule.scale)) throw invalid();
      const nonzero = /[1-9]/.test(whole + fraction);
      if ((rule.minimum === '0' || rule.positive) && value.startsWith('-') && nonzero) throw invalid();
      if (rule.positive && !nonzero) throw invalid();
      if (rule.maximum && (BigInt(whole) > BigInt(rule.maximum) || (BigInt(whole) === BigInt(rule.maximum) && /[1-9]/.test(fraction)))) throw invalid();
    } else if (rule.type === 'date') date(value);
    else if (rule.type === 'timestamp') {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw invalid();
      date(value.slice(0, 10));
    } else if (rule.type === 'interval') {
      // Unambiguous ISO duration only; PostgreSQL remains the constraint authority.
      if (typeof value !== 'string' || value.length > 80 || !/^P(?=\d|T\d)(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/.test(value)) throw invalid();
    } else text(value, rule.maxLength || 8000);
    result[key] = value;
  }
  return result;
}
function visitInput(input) {
  object(input, ['ngay_kham', 'ma_phong_kham']);
  return { ngay_kham: date(input.ngay_kham), ma_phong_kham: input.ma_phong_kham == null ? null : identifier(input.ma_phong_kham) };
}
function existingIntake(input) {
  object(input, ['record', 'visit']);
  object(input.record, ['loai_benh_an']);
  if (!['CAP', 'MAN'].includes(input.record.loai_benh_an)) throw invalid();
  return { record: { loai_benh_an: input.record.loai_benh_an }, visit: visitInput(input.visit) };
}
function prescription(input) {
  object(input, ['ngay_ke_don', 'ghi_chu_dieu_tri', 'items', 'stop_instructions']);
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) throw invalid();
  const items = input.items.map((item) => {
    object(item, ['ma_thuoc', 'ten_thuoc_bo_sung', 'lieu_dung', 'thoi_gian_dung']);
    const drug = text(item.ma_thuoc, 50), name = text(item.ten_thuoc_bo_sung, 255);
    if ((drug !== null) === (name !== null) || (drug !== null && !drug.trim()) || (name !== null && !name.trim())) throw invalid();
    return { ma_thuoc: drug, ten_thuoc_bo_sung: name, lieu_dung: text(item.lieu_dung, 100, true), thoi_gian_dung: text(item.thoi_gian_dung, 100, true) };
  });
  const stops = input.stop_instructions ?? [];
  if (!Array.isArray(stops) || stops.length > 50) throw invalid();
  const instructions = stops.map((item) => {
    object(item, ['thuoc_can_ngung', 'ngung_tu_ngay', 'thoi_gian_ngung_ngay', 'muc_dich', 'muc_dich_khac_ghi_ro']);
    const purpose = text(item.muc_dich, 100), detail = text(item.muc_dich_khac_ghi_ro, 255);
    if (purpose !== null && !['Test huyet thanh tu than', 'Test kich thich', 'Khac'].includes(purpose)) throw invalid();
    if (purpose === 'Khac' ? !detail?.trim() : detail !== null) throw invalid();
    const days = item.thoi_gian_ngung_ngay ?? null;
    if (days !== null && (!Number.isInteger(days) || days < 0 || days > 2147483647)) throw invalid();
    return { thuoc_can_ngung: text(item.thuoc_can_ngung, 255, true), ngung_tu_ngay: item.ngung_tu_ngay == null ? null : date(item.ngung_tu_ngay), thoi_gian_ngung_ngay: days, muc_dich: purpose, muc_dich_khac_ghi_ro: detail };
  });
  return { ngay_ke_don: date(input.ngay_ke_don), ghi_chu_dieu_tri: text(input.ghi_chu_dieu_tri), items, stop_instructions: instructions };
}
module.exports = { invalid, object, date, text, patch, visitInput, existingIntake, prescription };
