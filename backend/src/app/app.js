const express = require('express');
const { healthRouter } = require('../modules/health/health.routes');
const { notFound, errorHandler } = require('../shared/http');

function createApp({ pool = null, authConfig = {}, mediaStorage = null } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use('/health', healthRouter);
  if (pool && authConfig.jwtSecret) {
    const { createAuthModule } = require('../modules/auth/auth');
    const { createClinicalRouter } = require('../modules/clinical/clinical.routes');
    const { createAdministrationRouter } = require('../modules/administration/administration.routes');
    const { createMediaRouter } = require('../modules/media/media.routes');
    const auth = createAuthModule({ pool, ...authConfig });
    app.use('/api/v1/auth', auth.router);
    const dependencies = { pool, mediaStorage, patientSignupRoleId: authConfig.patientSignupRoleId, authenticate: auth.authenticate, authorize: auth.authorize };
    app.use('/api/v1/admin', createAdministrationRouter(dependencies));
    app.use('/api/v1/medical-records/:id/attachments', createMediaRouter(dependencies));
    app.use('/api/v1', createClinicalRouter(dependencies));
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
