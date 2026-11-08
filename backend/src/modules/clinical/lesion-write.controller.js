const { createLesionWriteService } = require('./lesion-write.service');
function createLesionWriteController(pool) {
  const service = createLesionWriteService(pool);
  const handler = (method, status, ids) => async (req, res) => {
    const data = await service[method](req.auth, ...ids.map((key) => req.params[key]), req.body);
    res.status(status).json({ code: '1000', message: 'OK', data });
  };
  return { createEpisode: handler('createEpisode', 201, ['id']), createLocation: handler('createLocation', 201, ['id', 'episodeId']),
    createPhoto: handler('createPhoto', 201, ['id', 'episodeId']), updatePhoto: handler('updatePhoto', 200, ['id', 'episodeId', 'photoId']) };
}
module.exports = { createLesionWriteController };
