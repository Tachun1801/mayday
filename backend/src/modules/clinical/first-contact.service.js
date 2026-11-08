const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const validate = require('./first-contact.validation');
const repository = require('./first-contact.repository');
const writes = require('./clinical-write.repository');
function createFirstContactService(pool, patientRoleId) {
  identifier(patientRoleId);
  function staff(principal) { if (!principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied'); return identifier(String(principal.staff_id)); }
  function available() { if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable'); }
  return {
    async lookup(principal, body) {
      staff(principal); const input = validate.contact(body); available();
      const result = await repository.lookup(pool, input, patientRoleId);
      if (!result) throw new HttpError(404, null, 'No matching first-contact patient');
      return result;
    },
    async intake(principal, patientId, body) {
      const staffId = staff(principal), id = identifier(patientId), input = validate.intake(body); available();
      try {
        return await withTransaction(pool, async (client) => {
          if (!await repository.lockCandidate(client, id, input, patientRoleId)) throw new HttpError(404, null, 'No matching first-contact patient');
          // Separate statement after the patient lock, explicitly READ COMMITTED:
          // a competing intake that just committed must be visible here.
          if (await repository.hasRecords(client, id)) throw new HttpError(409, '2003', 'Patient already received or first-contact data changed');
          await writes.checkStaffRoom(client, staffId, input.visit.ma_phong_kham);
          const record = await writes.insertRecord(client, id, input.record.loai_benh_an);
          if (record.status !== 'draft') throw new Error('Unexpected initial record state');
          await writes.insertFields(client, input.record.loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman', { ma_ho_so: record.record_id }, {});
          const visit = await writes.insertVisit(client, record.record_id, staffId, input.record.loai_benh_an, input.visit);
          return { patient_id: id, record_id: String(record.record_id), visit_id: visit.visit_id, status: 'draft' };
        }, { isolation: 'read_committed' });
      } catch (error) {
        if (['23505', '40001', '40P01'].includes(error.code)) throw new HttpError(409, '2003', 'First-contact data changed or conflicts');
        if (['23503', '23514', '23502', '22001'].includes(error.code)) throw new HttpError(400, '2003', 'Invalid first-contact request');
        throw error;
      }
    },
  };
}
module.exports = { createFirstContactService };
