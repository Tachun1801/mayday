const { HttpError } = require('./errors');
function createPrincipalLimiter({ max = 10, windowMs = 60000, maxEntries = 1000, now = Date.now } = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    const key = req.auth?.account_id;
    if (!key) return next(new HttpError(403, '3101', 'Permission denied'));
    const timestamp = now();
    for (const [id, value] of attempts) if (value.expires <= timestamp) attempts.delete(id);
    let entry = attempts.get(key);
    if (!entry && attempts.size < maxEntries) { entry = { count: 0, expires: timestamp + windowMs }; attempts.set(key, entry); }
    if (!entry || entry.count >= max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil(((entry?.expires || timestamp + windowMs) - timestamp) / 1000))));
      return next(new HttpError(429, null, 'Too many first-contact attempts'));
    }
    entry.count++; next();
  };
}
module.exports = { createPrincipalLimiter };
