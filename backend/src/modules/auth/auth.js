const { Router } = require('express');
const { createAuthRepository } = require('./auth.repository');
const { createAuthService, authError } = require('./auth.service');
const { createSignupService } = require('./signup.service');

function createLoginLimiter({ now = Date.now, maxEntries = 1000, maxAttempts = 10, windowMs = 60000 } = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    const timestamp = now();
    for (const [key, entry] of attempts) {
      if (timestamp >= entry.expiresAt) attempts.delete(key);
    }
    const key = req.ip || 'unknown';
    let entry = attempts.get(key);
    if (!entry && attempts.size < maxEntries) {
      entry = { count: 0, expiresAt: timestamp + windowMs };
      attempts.set(key, entry);
    }
    if (!entry || entry.count >= maxAttempts) {
      res.set('Retry-After', String(Math.max(1, Math.ceil(((entry?.expiresAt || timestamp + windowMs) - timestamp) / 1000))));
      return res.status(429).json({ message: 'Too many login attempts', data: null });
    }
    entry.count += 1;
    return next();
  };
}

function createAuthModule({ pool, jwtSecret, actionPermissions = {}, passwordVerifier, patientSignupRoleId }) {
  const repository = createAuthRepository(pool);
  const service = createAuthService({ repository, jwtSecret, passwordVerifier });
  const router = Router();
  if (patientSignupRoleId) {
    const signup = createSignupService(pool, patientSignupRoleId);
    router.post('/signup', createLoginLimiter({ maxAttempts: 5 }), async (req, res) => {
      const data = await signup(req.body);
      res.status(201).json({ code: '1000', message: 'OK', data });
    });
  }

  async function authenticate(req, _res, next) {
    try {
      const authorization = req.get('authorization');
      if (!authorization) throw authError(401, '3003', 'User not authenticated');
      const match = /^Bearer ([^\s]+)$/i.exec(authorization);
      if (!match) throw authError(401, '3001', 'Token is invalid');
      req.auth = await service.authenticateToken(match[1]);
      next();
    } catch (error) {
      next(error);
    }
  }

  function authorize(action) {
    return (req, _res, next) => {
      if (!req.auth) return next(authError(401, '3003', 'User not authenticated'));
      const mapping = Object.hasOwn(actionPermissions, action) ? actionPermissions[action] : null;
      const required = typeof mapping === 'string' ? [mapping] : mapping;
      if (!Array.isArray(required) || !required.length ||
          !required.every((permission) => typeof permission === 'string' && permission.length && req.auth.permissions.includes(permission))) {
        return next(authError(403, '3101', 'Permission denied'));
      }
      return next();
    };
  }

  router.post('/login', createLoginLimiter(), async (req, res, next) => {
    try {
      const data = await service.login(req.body);
      res.json({ code: '1000', message: 'OK', data });
    } catch (error) {
      next(error);
    }
  });
  router.get('/me', authenticate, (req, res) => {
    res.json({ code: '1000', message: 'OK', data: { user_info: req.auth } });
  });
  router.put('/me', authenticate, async (req, res, next) => {
    try {
      const data = await service.updateOwnProfile(req.auth.account_id, req.body);
      res.json({ code: '1000', message: 'OK', data });
    } catch (error) {
      next(error);
    }
  });
  router.post('/change-password', authenticate, createLoginLimiter(), async (req, res, next) => {
    try {
      const data = await service.changePassword(req.auth.account_id, req.body);
      res.json({ code: '1000', message: 'OK', data });
    } catch (error) {
      next(error);
    }
  });

  return { router, authenticate, authorize, loadPrincipal: service.loadPrincipal, service };
}

module.exports = { createAuthModule, createLoginLimiter };
