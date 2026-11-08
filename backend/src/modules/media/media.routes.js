const express = require('express');
const { HttpError } = require('../../shared/errors');
const { createMediaService } = require('./media.service');
const { MAX_IMAGE_BYTES, types } = require('./media.validation');
function paging(query) {
  const page = query.page ?? '1', limit = query.limit ?? '20';
  if (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || Number(page) > 1000000 || typeof limit !== 'string' || !/^[1-9]\d*$/.test(limit) || Number(limit) > 100) throw new HttpError(400, '2003', 'Invalid pagination');
  return { page: Number(page), limit: Number(limit), offset: (Number(page) - 1) * Number(limit) };
}
function createMediaRouter({ pool, mediaStorage, authenticate, authorize }) {
  const router = express.Router({ mergeParams: true }), service = createMediaService(pool, mediaStorage);
  const raw = express.raw({ type: Object.keys(types), limit: MAX_IMAGE_BYTES, inflate: false });
  // Bound buffered image work before parsing the body. This is process-local
  // capacity control, not a persistent or distributed rate/quota store.
  const active = new Map(), leaseKey = Symbol('mediaLease');
  let total = 0;
  function capacity(req, res, next) {
    const account = req.auth?.account_id;
    if (!account) return next(new HttpError(403, '3101', 'Permission denied'));
    if (total >= 4 || active.has(account)) {
      res.set('Retry-After', '2');
      return next(new HttpError(429, null, 'Another image operation is in progress; try again after readback'));
    }
    total++; active.set(account, true);
    let released = false;
    const lease = { running: false, finished: false, release() { if (!released) { released = true; total--; active.delete(account); } } };
    req[leaseKey] = lease;
    function finished() { lease.finished = true; if (!lease.running) lease.release(); }
    res.once('finish', finished); res.once('close', finished);
    next();
  }
  router.use(authenticate);
  router.get('/', authorize('media.read'), async (req, res) => {
    const data = await service.list(req.auth, req.params.id, paging(req.query));
    res.json({ code: '1000', message: 'OK', data });
  });
  router.post('/', authorize('media.write'), capacity, (req, res, next) => {
    if (Object.keys(req.query).length) return next(new HttpError(400, '2003', 'Unexpected upload query parameters'));
    if (!Object.hasOwn(types, req.get('content-type')?.split(';')[0].trim()) || (req.get('content-encoding') && req.get('content-encoding') !== 'identity')) return next(new HttpError(415, '6002', 'Unsupported image file format'));
    raw(req, res, (error) => next(error?.type === 'entity.too.large' ? new HttpError(413, '6003', 'Image file size exceeds limit') : error));
  }, async (req, res) => {
    const lease = req[leaseKey]; lease.running = true;
    try {
      const data = await service.upload(req.auth, req.params.id, req.body, req.get('content-type').split(';')[0].trim(), req.get('x-file-name'));
      res.status(201).json({ code: '1000', message: 'OK', data });
    } finally { lease.running = false; if (lease.finished) lease.release(); }
  });
  router.get('/:attachmentId/content', authorize('media.read'), capacity, async (req, res) => {
    const lease = req[leaseKey]; lease.running = true;
    try {
      const result = await service.download(req.auth, req.params.id, req.params.attachmentId);
      res.set('Content-Type', result.mime);
      res.set('Cache-Control', 'private, no-store');
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Content-Security-Policy', "default-src 'none'; sandbox");
      res.set('Content-Disposition', 'inline');
      res.send(result.buffer);
    } finally { lease.running = false; if (lease.finished) lease.release(); }
  });
  return router;
}
module.exports = { createMediaRouter };
