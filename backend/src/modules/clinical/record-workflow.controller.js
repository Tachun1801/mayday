const { createRecordWorkflowService } = require('./record-workflow.service');

function createRecordWorkflowController(pool) {
  const changeStatus = createRecordWorkflowService(pool);
  return async function patchStatus(req, res) {
    const data = await changeStatus(req.auth, req.params.id, req.body);
    res.json({ code: '1000', message: 'OK', data });
  };
}

module.exports = { createRecordWorkflowController };
