const { Router } = require('express');
const { createClinicalService } = require('./clinical.service');
const { createIntakeService } = require('./intake.service');
const { createRecordWorkflowController } = require('./record-workflow.controller');
const { createClinicalWriteController } = require('./clinical-write.controller');
const { createDailyUasService } = require('./uas.service');
const { createCatalogWriteController } = require('./catalog-write.controller');
const { createLesionWriteController } = require('./lesion-write.controller');
const { createFirstContactController } = require('./first-contact.controller');
const { createPrincipalLimiter } = require('../../shared/rate-limit');
const { identifier, pagination, keyword } = require('./clinical.validation');

function createClinicalRouter({ pool, authenticate, authorize, patientSignupRoleId }) {
  const router = Router();
  const service = createClinicalService(pool);
  const createIntake = createIntakeService(pool);
  const write = createClinicalWriteController(pool);
  const dailyUas = createDailyUasService(pool);
  const catalogWrite = createCatalogWriteController(pool);
  const lesions = createLesionWriteController(pool);
  router.use(authenticate);
  if (patientSignupRoleId) {
    const firstContact = createFirstContactController(pool, patientSignupRoleId);
    const limit = createPrincipalLimiter();
    router.post('/patients/first-contact/lookup', authorize('patients.write'), authorize('records.write'), limit, firstContact.lookup);
    router.post('/patients/:id/first-contact', authorize('patients.write'), authorize('records.write'), limit, firstContact.intake);
  }
  function get(path, action, handler) {
    router.get(path, authorize(action), async (req, res) => {
      const data = await handler(req);
      res.json({ code: '1000', message: 'OK', data });
    });
  }
  get('/patients', 'patients.read', (req) => service.patients(req.auth, pagination(req.query), keyword(req.query.keyword)));
  get('/patients/:id', 'patients.read', (req) => service.patient(req.auth, identifier(req.params.id)));
  get('/patients/:id/medical-records', 'records.read', (req) => service.patientRecords(req.auth, identifier(req.params.id), pagination(req.query)));
  get('/patients/:id/uas', 'uas.read', (req) => service.uas(req.auth, identifier(req.params.id), pagination(req.query)));
  for (const kind of ['branches', 'departments', 'rooms']) {
    get(`/facilities/${kind}`, 'facilities.read', (req) => service.facilities(req.auth, kind, pagination(req.query)));
  }
  get('/medical-records', 'records.read', (req) => service.records(req.auth, pagination(req.query)));
  get('/medical-records/:id', 'records.read', (req) => service.record(req.auth, identifier(req.params.id)));
  get('/medical-records/:id/visits', 'records.read', (req) => service.visits(req.auth, identifier(req.params.id), pagination(req.query)));
  get('/medical-records/:id/visits/:visitId', 'records.read', (req) => service.visit(req.auth, identifier(req.params.id), identifier(req.params.visitId)));
  get('/medical-records/:id/clinical/:section', 'records.read', (req) => service.clinicalSection(req.auth, identifier(req.params.id), req.params.section, pagination(req.query)));
  get('/medical-records/:id/prescriptions', 'prescriptions.read', (req) => service.prescriptions(req.auth, identifier(req.params.id), pagination(req.query)));
  get('/medical-records/:id/labs', 'labs.read', (req) => service.labs(req.auth, identifier(req.params.id), pagination(req.query)));
  get('/medical-records/:id/lesions', 'records.read', (req) => service.lesionEpisodes(req.auth, identifier(req.params.id), pagination(req.query)));
  get('/medical-records/:id/lesions/:episodeId/:kind', 'records.read', (req) => service.lesionChildren(req.auth, identifier(req.params.id), identifier(req.params.episodeId), req.params.kind, pagination(req.query)));
  get('/catalogs/drugs', 'catalogs.read', (req) => service.drugs(pagination(req.query), keyword(req.query.keyword)));
  get('/catalogs/wheal-characteristics', 'catalogs.read', (req) => service.whealCharacteristics(pagination(req.query)));
  for (const kind of ['branches', 'departments', 'rooms']) {
    if (kind !== 'branches') router.post(`/facilities/${kind}`, authorize('facilities.write'), catalogWrite(kind, true));
    router.patch(`/facilities/${kind}/:id`, authorize('facilities.write'), catalogWrite(kind, false));
  }
  for (const kind of ['drugs', 'wheal-characteristics']) {
    router.post(`/catalogs/${kind}`, authorize('catalogs.write'), catalogWrite(kind, true));
    router.patch(`/catalogs/${kind}/:id`, authorize('catalogs.write'), catalogWrite(kind, false));
  }
  router.patch('/medical-records/:id/status', authorize('records.write'), createRecordWorkflowController(pool));
  router.post('/uas/daily', authorize('uas.write'), async (req, res) => {
    const data = await dailyUas(req.auth, req.body);
    res.status(201).json({ code: '1000', message: 'OK', data });
  });
  router.post('/patients/:id/intakes', authorize('patients.write'), authorize('records.write'), write.existingIntake);
  router.patch('/patients/:id', authorize('patients.write'), write.updatePatient);
  router.post('/medical-records/:id/visits', authorize('records.write'), write.addVisit);
  router.patch('/medical-records/:id/content', authorize('records.write'), write.updateRecord);
  router.patch('/medical-records/:id/visits/:visitId', authorize('records.write'), write.updateVisit);
  router.patch('/medical-records/:id/clinical/:section', authorize('records.write'), write.updateHistory);
  router.post('/medical-records/:id/visits/:visitId/details/:kind', authorize('records.write'), write.addVisitDetail);
  router.post('/medical-records/:id/visits/:visitId/labs', authorize('records.write'), write.addLab);
  router.post('/medical-records/:id/visits/:visitId/prescriptions', authorize('records.write'), write.prescribe);
  router.post('/medical-records/:id/lesions', authorize('lesions.write'), lesions.createEpisode);
  router.post('/medical-records/:id/lesions/:episodeId/locations', authorize('lesions.write'), lesions.createLocation);
  router.post('/medical-records/:id/lesions/:episodeId/photos', authorize('lesions.write'), lesions.createPhoto);
  router.patch('/medical-records/:id/lesions/:episodeId/photos/:photoId', authorize('lesions.write'), lesions.updatePhoto);
  router.post('/intakes', authorize('patients.write'), authorize('records.write'), async (req, res) => {
    const data = await createIntake(req.auth, req.body);
    res.status(201).json({ code: '1000', message: 'OK', data });
  });
  return router;
}

module.exports = { createClinicalRouter };
