const { Router } = require('express');
const { HttpError } = require('../../shared/errors');
const { createAdministrationRepository } = require('./administration.repository');
const { createAdministrationWriteController } = require('./administration-write.controller');
const { identifier } = require('./administration-write.validation');

function createAdministrationRouter({ pool, authenticate, authorize }) {
  const router = Router();
  const repository = createAdministrationRepository(pool);
  const write = createAdministrationWriteController(pool);
  router.use(authenticate);
  router.use((req, _res, next) => req.auth?.staff_id ? next() : next(new HttpError(403, '3101', 'Permission denied')));
  router.post('/staff', authorize('accounts.write'), write.createStaff);
  router.patch('/accounts/:id', authorize('accounts.write'), write.updateAccount);
  router.post('/roles', authorize('permissions.write'), write.createRole);
  router.put('/roles/:id/permissions', authorize('permissions.write'), write.replacePermissions);
  router.get('/roles/:id/permissions', authorize('permissions.read'), async (req, res) => {
    const data = await repository.rolePermissions(identifier(req.params.id));
    res.json({ code: '1000', message: 'OK', data });
  });
  for (const [resource, action] of [['accounts', 'accounts.read'], ['roles', 'permissions.read'], ['permissions', 'permissions.read']]) {
    router.get(`/${resource}`, authorize(action), async (req, res) => {
      const pageText = req.query.page ?? '1';
      const limitText = req.query.limit ?? '20';
      if (typeof pageText !== 'string' || !/^[1-9]\d*$/.test(pageText) ||
          typeof limitText !== 'string' || !/^[1-9]\d*$/.test(limitText)) {
        throw new HttpError(400, '2003', 'Invalid pagination');
      }
      const page = Number(pageText), limit = Number(limitText);
      if (!Number.isSafeInteger(page) || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
        throw new HttpError(400, '2003', 'Invalid pagination');
      }
      const data = await repository.list(resource, page, limit, req.auth);
      res.json({ code: '1000', message: 'OK', data });
    });
  }
  return router;
}

module.exports = { createAdministrationRouter };
