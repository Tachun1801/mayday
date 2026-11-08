const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const { validateRecordStatus } = require('./record-workflow.validation');
const { lockAssignedRecord, updateAssignedStatus } = require('./record-workflow.repository');

function createRecordWorkflowService(pool) {
  return async function changeStatus(principal, id, body) {
    if (!principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
    const recordId = identifier(id);
    const staffId = identifier(String(principal.staff_id));
    const target = validateRecordStatus(body);
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    return withTransaction(pool, async (client) => {
      const record = await lockAssignedRecord(client, recordId, staffId);
      // A missing record and a record outside the doctor's assignment share
      // the same response, including for principals with a patient subtype.
      if (!record) throw new HttpError(404, '4001', 'Medical record not found');
      if (record.status === 'completed') throw new HttpError(409, '4003', 'Medical record already completed');
      const previous = target === 'in_progress' ? 'draft' : 'in_progress';
      if (record.status !== previous) throw new HttpError(409, '4009', 'Invalid medical record status transition');
      const result = await updateAssignedStatus(client, recordId, staffId, previous, target);
      if (!result) throw new HttpError(409, '4009', 'Medical record status or assignment changed');
      return { id: String(result.id), status: result.status };
    });
  };
}

module.exports = { createRecordWorkflowService };
