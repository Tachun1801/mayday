const { createFirstContactService } = require('./first-contact.service');
function createFirstContactController(pool, roleId) {
  const service = createFirstContactService(pool, roleId);
  return {
    async lookup(req, res) { const data = await service.lookup(req.auth, req.body); res.json({ code: '1000', message: 'OK', data }); },
    async intake(req, res) { const data = await service.intake(req.auth, req.params.id, req.body); res.status(201).json({ code: '1000', message: 'OK', data }); },
  };
}
module.exports = { createFirstContactController };
