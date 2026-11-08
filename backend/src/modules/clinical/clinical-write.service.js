const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const validate = require('./clinical-write.validation');
const repository = require('./clinical-write.repository');
const { lockAssignedRecord } = require('./record-workflow.repository');
const { serialize } = require('./clinical.service');

const history = {
  'personal-history': ['tiensubanthan', 'ma_tien_su_ban_than', 'MAN'],
  'previous-episodes': ['benhsucacdotbenhtruoc', 'ma_tien_su', 'MAN'],
  'allergy-context': ['hoancanhkhoiphatdiung', 'ma_hoan_canh_khoi_phat', null],
  infections: ['tinhtrangnhiemtrung', 'ma_tinh_trang_nhiem_trung', 'CAP'],
};
function staff(principal) {
  if (!principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
  return identifier(String(principal.staff_id));
}
async function transaction(pool, operation) {
  if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
  try { return serialize(await withTransaction(pool, operation)); }
  catch (error) {
    if (error.code === '23505') throw new HttpError(409, '2003', 'Conflicting clinical data');
    if (['23503', '23514', '23502', '22001', '22003', '22007', '22008', '22P02', '22015'].includes(error.code)) throw validate.invalid();
    throw error;
  }
}
function createClinicalWriteService(pool) {
  async function assigned(principal, id, operation) {
    const staffId = staff(principal), recordId = identifier(id);
    return transaction(pool, async (client) => {
      const record = await lockAssignedRecord(client, recordId, staffId);
      if (!record) throw new HttpError(404, '4001', 'Medical record not found');
      if (!['draft', 'in_progress'].includes(record.status)) throw new HttpError(409, record.status === 'completed' ? '4003' : '4009', 'Medical record is not writable');
      if (!['CAP', 'MAN'].includes(record.loai_benh_an)) throw new Error('Invalid persisted record type');
      return operation(client, record, staffId, recordId);
    });
  }
  return {
    async updatePatient(principal, patientId, body) {
      const staffId = staff(principal), id = identifier(patientId);
      validate.object(body, ['person', 'patient']);
      const person = validate.patch('nguoi', body.person ?? {}, true);
      const patient = validate.patch('benhnhan', body.patient ?? {}, true);
      if (!Object.keys(person).length && !Object.keys(patient).length) throw validate.invalid();
      return transaction(pool, async (client) => {
        if (!await repository.lockActivePatient(client, id, staffId)) throw new HttpError(404, '4001', 'Patient not found');
        await repository.updateFields(client, 'nguoi', 'ma_nguoi', id, person);
        await repository.updateFields(client, 'benhnhan', 'ma_benh_nhan', id, patient);
        return { patient_id: id };
      });
    },
    async existingIntake(principal, patientId, body) {
      const staffId = staff(principal), id = identifier(patientId), input = validate.existingIntake(body);
      return transaction(pool, async (client) => {
        // Patient-only ownership never grants assignment. The doctor must
        // already have a visit on a record of this patient.
        if (!await repository.lockKnownPatient(client, id, staffId)) throw new HttpError(404, '4001', 'Patient not found');
        await repository.checkStaffRoom(client, staffId, input.visit.ma_phong_kham);
        const row = await repository.insertRecord(client, id, input.record.loai_benh_an);
        if (row.status !== 'draft') throw new Error('Unexpected initial record state');
        await repository.insertFields(client, input.record.loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman', { ma_ho_so: row.record_id }, {});
        const visit = await repository.insertVisit(client, row.record_id, staffId, input.record.loai_benh_an, input.visit);
        return { patient_id: id, record_id: String(row.record_id), ...visit, status: row.status };
      });
    },
    async addVisit(principal, id, body) {
      staff(principal);
      const input = validate.visitInput(body);
      return assigned(principal, id, async (client, record, staffId, recordId) =>
        ({ record_id: recordId, ...await repository.insertVisit(client, recordId, staffId, record.loai_benh_an, input) }));
    },
    async updateRecord(principal, id, body) {
      staff(principal);
      validate.object(body, ['record', 'detail']);
      const common = validate.patch('hosobenhan', body.record ?? {}, true);
      if (!Object.keys(common).length && !Object.keys(body.detail ?? {}).length) throw validate.invalid();
      return assigned(principal, id, async (client, record, _staffId, recordId) => {
        const table = record.loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman';
        const detail = validate.patch(table, body.detail ?? {}, true);
        await repository.updateFields(client, 'hosobenhan', 'ma_ho_so', recordId, common);
        await repository.updateFields(client, table, 'ma_ho_so', recordId, detail);
        return { id: recordId };
      });
    },
    async updateVisit(principal, id, visitId, body) {
      staff(principal);
      identifier(visitId);
      validate.object(body, ['visit', 'detail']);
      const common = validate.patch('phienkham', body.visit ?? {}, true);
      if (!Object.keys(common).length && !Object.keys(body.detail ?? {}).length) throw validate.invalid();
      return assigned(principal, id, async (client, record, staffId, recordId) => {
        await repository.lockVisit(client, recordId, visitId, staffId);
        const table = record.loai_benh_an === 'CAP' ? 'phienkhamcap' : 'phienkhamman';
        const detail = validate.patch(table, body.detail ?? {}, true);
        await repository.updateFields(client, 'phienkham', 'ma_phien_kham', visitId, common);
        await repository.updateFields(client, table, 'ma_phien_kham', visitId, detail);
        return { id: visitId, record_id: recordId };
      });
    },
    async updateHistory(principal, id, section, body) {
      staff(principal);
      if (!Object.hasOwn(history, section)) throw validate.invalid();
      const [table, key, type] = history[section], input = validate.patch(table, body);
      return assigned(principal, id, async (client, record, _staffId, recordId) => {
        if (type && record.loai_benh_an !== type) throw validate.invalid();
        const existing = await repository.historyRow(client, table, key, recordId);
        if (existing) await repository.updateFields(client, table, key, existing.id, input);
        else await repository.insertFields(client, table, { ma_ho_so: recordId }, input);
        return { record_id: recordId };
      });
    },
    async addVisitDetail(principal, id, visitId, kind, body) {
      staff(principal);
      identifier(visitId);
      const types = { vitals: 'dauhieusinhton', 'acute-lesions': 'chitiettonthuongcaptinh', 'chronic-lesions': 'chitiettonthuongsanphu' };
      if (!Object.hasOwn(types, kind)) throw validate.invalid();
      const input = validate.patch(types[kind], body);
      return assigned(principal, id, async (client, record, staffId, recordId) => {
        await repository.lockVisit(client, recordId, visitId, staffId);
        if ((kind === 'acute-lesions' && record.loai_benh_an !== 'CAP') || (kind === 'chronic-lesions' && record.loai_benh_an !== 'MAN')) throw validate.invalid();
        const fixed = { ma_phien_kham: visitId };
        if (kind === 'vitals') fixed.ma_bac_si = staffId;
        await repository.insertFields(client, types[kind], fixed, input);
        return { record_id: recordId, visit_id: visitId };
      });
    },
    async addLab(principal, id, visitId, body) {
      staff(principal);
      identifier(visitId);
      validate.object(body, ['result', 'detail']);
      const common = validate.patch('ketquacanlamsang', body.result ?? {}, true);
      if (!Object.keys(common).length && !Object.keys(body.detail ?? {}).length) throw validate.invalid();
      return assigned(principal, id, async (client, record, staffId, recordId) => {
        await repository.lockVisit(client, recordId, visitId, staffId);
        const table = record.loai_benh_an === 'CAP' ? 'ketquacanlamsangcap' : 'ketquacanlamsangman';
        const detail = validate.patch(table, body.detail ?? {}, true);
        const row = await repository.insertFields(client, 'ketquacanlamsang', { ma_phien_kham: visitId, loai_ket_qua_can_lam_sang: record.loai_benh_an }, common);
        await repository.insertFields(client, table, { ma_ket_qua_can_lam_sang: row.ma_ket_qua_can_lam_sang }, detail);
        return { result_id: String(row.ma_ket_qua_can_lam_sang), record_id: recordId };
      });
    },
    async prescribe(principal, id, visitId, body) {
      staff(principal);
      identifier(visitId);
      const input = validate.prescription(body);
      return assigned(principal, id, async (client, _record, staffId, recordId) => {
        await repository.lockVisit(client, recordId, visitId, staffId);
        const prescriptionId = await repository.insertPrescription(client, recordId, visitId, input);
        return { prescription_id: String(prescriptionId), record_id: recordId };
      });
    },
  };
}
module.exports = { createClinicalWriteService };
