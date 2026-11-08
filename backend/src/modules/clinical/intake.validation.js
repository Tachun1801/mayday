const { HttpError } = require('../../shared/errors');
const { identifier } = require('./clinical.validation');
function invalid() { return new HttpError(400, '2003', 'Invalid intake request'); }
function exactObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key))) throw invalid();
}
function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) throw invalid();
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw invalid();
  return value;
}
function validateIntake(body, today = new Date().toISOString().slice(0, 10)) {
  exactObject(body, ['patient', 'record', 'visit']);
  exactObject(body.patient, ['ho_ten', 'so_dien_thoai', 'ngay_sinh', 'gioi_tinh']);
  exactObject(body.record, ['loai_benh_an']);
  exactObject(body.visit, ['ngay_kham', 'ma_phong_kham']);
  const { patient, record, visit } = body;
  if (typeof patient.ho_ten !== 'string' || !patient.ho_ten.trim() || [...patient.ho_ten.trim()].length > 150 ||
      typeof patient.so_dien_thoai !== 'string' || !/^[0-9]{10}$/.test(patient.so_dien_thoai)) throw invalid();
  const birthDate = patient.ngay_sinh == null ? null : dateOnly(patient.ngay_sinh);
  if (birthDate && birthDate > today) throw invalid();
  if (patient.gioi_tinh != null && !['Nam', 'Nu'].includes(patient.gioi_tinh)) throw invalid();
  if (!['CAP', 'MAN'].includes(record.loai_benh_an)) throw invalid();
  return {
    patient: { ho_ten: patient.ho_ten.trim(), so_dien_thoai: patient.so_dien_thoai, ngay_sinh: birthDate, gioi_tinh: patient.gioi_tinh ?? null },
    record: { loai_benh_an: record.loai_benh_an },
    visit: { ngay_kham: dateOnly(visit.ngay_kham), ma_phong_kham: visit.ma_phong_kham == null ? null : identifier(visit.ma_phong_kham) },
  };
}
module.exports = { validateIntake };
