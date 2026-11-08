const { createCatalogWriteService } = require('./catalog-write.service');
function createCatalogWriteController(pool) {
  const save = createCatalogWriteService(pool);
  return (kind, create) => async (req, res) => {
    const data = await save(req.auth, kind, create ? null : req.params.id, req.body);
    res.status(create ? 201 : 200).json({ code: '1000', message: 'OK', data });
  };
}
module.exports = { createCatalogWriteController };
