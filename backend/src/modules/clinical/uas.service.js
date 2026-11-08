const { lockPatientRecord, insertDailyScore } = require('./uas.repository');
const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const { object, date, invalid } = require('./clinical-write.validation');
function scoreDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function createDailyUasService(pool, { today = scoreDate } = {}) {
  return async (principal, body) => {
    if (!principal?.patient_id) throw new HttpError(403, '3101', 'Permission denied');
    const patientId = identifier(String(principal.patient_id));
    object(body, ['ma_ho_so_man', 'ngay_cham_diem', 'diem_san_phu_hss', 'diem_ngua_iss']);
    const recordId = identifier(body.ma_ho_so_man);
    const day = date(body.ngay_cham_diem);
    if (day !== today()) throw invalid();
    for (const value of [body.diem_san_phu_hss, body.diem_ngua_iss]) if (!Number.isInteger(value) || value < 0 || value > 3) throw invalid();
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    try {
      return await withTransaction(pool, async (client) => {
        const record = await lockPatientRecord(client, recordId, patientId);
        if (!record) throw new HttpError(404, '4001', 'Medical record not found');
        if (!['draft', 'in_progress'].includes(record.status)) throw new HttpError(409, record.status === 'completed' ? '4003' : '4009', 'Medical record is not writable');
        return insertDailyScore(client, recordId, patientId, body);
      });
    } catch (error) {
      if (error.code === '23505') throw new HttpError(409, '5002', 'Daily UAS score already exists');
      if (['23503', '23514', '23502'].includes(error.code)) throw invalid();
      throw error;
    }
  };
}
module.exports = { createDailyUasService, scoreDate };
