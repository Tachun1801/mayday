const { createAdministrationWriteService } = require('./administration-write.service');
function createAdministrationWriteController(pool) {
  const service = createAdministrationWriteService(pool);
  const handler = (method, status, hasId = false) => async (req, res) => {
    const data = await service[method](req.auth, ...(hasId ? [req.params.id, req.body] : [req.body]));
    res.status(status).json({ code: '1000', message: 'OK', data });
  };
  return { createStaff: handler('createStaff', 201), updateAccount: handler('updateAccount', 200, true),
    createRole: handler('createRole', 201), replacePermissions: handler('replacePermissions', 200, true) };
}
module.exports = { createAdministrationWriteController };
