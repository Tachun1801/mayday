const { createClinicalWriteService } = require('./clinical-write.service');
function createClinicalWriteController(pool) {
  const service = createClinicalWriteService(pool);
  function handler(method, status, params) {
    return async (req, res) => {
      const data = await service[method](req.auth, ...params(req), req.body);
      res.status(status).json({ code: '1000', message: 'OK', data });
    };
  }
  return {
    updatePatient: handler('updatePatient', 200, (req) => [req.params.id]),
    existingIntake: handler('existingIntake', 201, (req) => [req.params.id]),
    addVisit: handler('addVisit', 201, (req) => [req.params.id]),
    updateRecord: handler('updateRecord', 200, (req) => [req.params.id]),
    updateVisit: handler('updateVisit', 200, (req) => [req.params.id, req.params.visitId]),
    updateHistory: handler('updateHistory', 200, (req) => [req.params.id, req.params.section]),
    addVisitDetail: handler('addVisitDetail', 201, (req) => [req.params.id, req.params.visitId, req.params.kind]),
    addLab: handler('addLab', 201, (req) => [req.params.id, req.params.visitId]),
    prescribe: handler('prescribe', 201, (req) => [req.params.id, req.params.visitId]),
  };
}
module.exports = { createClinicalWriteController };
