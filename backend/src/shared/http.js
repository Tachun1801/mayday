const { HttpError } = require('./errors');

function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ code: '2007', message: 'Request body invalid', data: null });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (error.expose === true && Number.isInteger(error.status) && ((error.status >= 400 && error.status < 500) || (error instanceof HttpError && error.status === 503 && ['9902', '9903'].includes(error.code)))) {
    const body = { message: error.message, data: null };
    if (error.code) body.code = String(error.code);
    return res.status(error.status).json(body);
  }
  return res.status(500).json({ code: '9901', message: 'Internal server error', data: null });
}

module.exports = { notFound, errorHandler };
