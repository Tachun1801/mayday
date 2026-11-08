const { createHmac, timingSafeEqual } = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const TOKEN_TTL_SECONDS = 900;
const JWT_OPTIONS = { algorithm: 'HS256', issuer: 'mayday', audience: 'mayday-clients' };
const DUMMY_BCRYPT_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

function authError(status, code, message) {
  return Object.assign(new Error(message), { status, code, expose: true });
}

function safeUserInfo(account) {
  const id = (value) => value == null ? null : String(value);
  return {
    account_id: id(account.account_id),
    person_id: id(account.person_id),
    username: account.username,
    full_name: account.full_name,
    phone: account.phone ?? null,
    birth_date: account.birth_date ?? null,
    gender: account.gender ?? null,
    role_id: id(account.role_id),
    branch_id: id(account.branch_id),
    staff_id: id(account.staff_id),
    patient_id: id(account.patient_id),
    permissions: Array.isArray(account.permissions) ? [...new Set(account.permissions)] : [],
  };
}

async function verifyBcryptPassword(password, hash) {
  if (typeof hash !== 'string' || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
    await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
    return false;
  }
  return bcrypt.compare(password, hash);
}

function validateProfilePatch(input) {
  const allowed = ['full_name', 'phone', 'birth_date', 'gender'];
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.keys(input).length ||
      !Object.keys(input).every((field) => allowed.includes(field))) {
    throw authError(400, '2003', 'Invalid parameter value');
  }
  const changes = { ...input };
  if (Object.hasOwn(changes, 'full_name')) {
    if (typeof changes.full_name !== 'string' || !changes.full_name.trim() || [...changes.full_name.trim()].length > 150) {
      throw authError(400, '2003', 'Invalid parameter value');
    }
    changes.full_name = changes.full_name.trim();
  }
  if (Object.hasOwn(changes, 'phone') && (typeof changes.phone !== 'string' || !/^\d{10}$/.test(changes.phone))) {
    throw authError(400, '2004', 'Invalid phone number format');
  }
  if (Object.hasOwn(changes, 'gender') && changes.gender !== null && !['Nam', 'Nu'].includes(changes.gender)) {
    throw authError(400, '2003', 'Invalid parameter value');
  }
  if (Object.hasOwn(changes, 'birth_date') && changes.birth_date !== null) {
    const value = changes.birth_date;
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
    if (!date || Number.isNaN(date.getTime()) || value.startsWith('0000') || date.toISOString().slice(0, 10) !== value || value > new Date().toISOString().slice(0, 10)) {
      throw authError(400, '2006', 'Invalid date format');
    }
  }
  return changes;
}

function createAuthService({ repository, jwtSecret, passwordVerifier = verifyBcryptPassword }) {
  if (typeof jwtSecret !== 'string' || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('Authentication requires a JWT secret of at least 32 bytes');
  }
  const version = (account) => createHmac('sha256', jwtSecret)
    .update(`${account.account_id}:${account.password_hash}`).digest('hex');

  async function currentAccount(accountId) {
    if (typeof accountId !== 'string' || !/^[1-9]\d{0,18}$/.test(accountId) || BigInt(accountId) > 9223372036854775807n) {
      throw authError(401, '3001', 'Token is invalid');
    }
    const account = await repository.findByAccountId(accountId);
    if (!account || account.is_active !== true) throw authError(401, '3001', 'Token is invalid');
    return account;
  }

  return {
    async login(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          typeof input.username !== 'string' || !input.username.trim() || [...input.username.trim()].length > 100 ||
          typeof input.password !== 'string' || !input.password || Buffer.byteLength(input.password) > 72) {
        throw authError(400, '2003', 'Invalid parameter value');
      }
      const account = await repository.findByUsername(input.username.trim());
      const passwordMatches = await passwordVerifier(input.password, account?.password_hash || DUMMY_BCRYPT_HASH);
      if (!account || account.is_active !== true || !passwordMatches) {
        throw authError(401, '3008', 'Invalid username or password');
      }
      const token = jwt.sign({ credential_version: version(account) }, jwtSecret, {
        ...JWT_OPTIONS, subject: String(account.account_id), expiresIn: TOKEN_TTL_SECONDS,
      });
      return { token, expires_in: TOKEN_TTL_SECONDS, user_info: safeUserInfo(account) };
    },
    async authenticateToken(token) {
      let claims;
      try {
        claims = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256'], issuer: JWT_OPTIONS.issuer, audience: JWT_OPTIONS.audience,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') throw authError(401, '3002', 'Token expired');
        throw authError(401, '3001', 'Token is invalid');
      }
      const account = await currentAccount(claims.sub);
      const currentVersion = version(account);
      const claimedVersion = claims.credential_version;
      if (typeof claimedVersion !== 'string' || !/^[a-f0-9]{64}$/.test(claimedVersion) ||
          !timingSafeEqual(Buffer.from(currentVersion), Buffer.from(claimedVersion))) {
        throw authError(401, '3001', 'Token is invalid');
      }
      return safeUserInfo(account);
    },
    async loadPrincipal(accountId) {
      return safeUserInfo(await currentAccount(accountId));
    },
    async updateOwnProfile(accountId, input) {
      const changes = validateProfilePatch(input);
      const account = await currentAccount(accountId);
      const updated = await repository.updatePerson(account.person_id, account.account_id, changes);
      if (!updated) throw authError(401, '3001', 'Token is invalid');
      return { user_info: safeUserInfo(await currentAccount(accountId)) };
    },
    async changePassword(accountId, input) {
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          !Object.keys(input).every((field) => ['old_password', 'new_password'].includes(field)) ||
          typeof input.old_password !== 'string' || !input.old_password || Buffer.byteLength(input.old_password) > 72 ||
          typeof input.new_password !== 'string' || Buffer.byteLength(input.new_password) < 12 || Buffer.byteLength(input.new_password) > 72) {
        throw authError(400, '2003', 'Invalid parameter value');
      }
      const account = await currentAccount(accountId);
      if (!await passwordVerifier(input.old_password, account.password_hash)) {
        throw authError(400, '3009', 'Old password incorrect');
      }
      const replacementHash = await bcrypt.hash(input.new_password, 12);
      const updated = await repository.changePassword(account.account_id, account.password_hash, replacementHash);
      if (!updated) throw authError(409, '3009', 'Password changed concurrently; sign in again');
      return { reauthenticate: true };
    },
  };
}

module.exports = { createAuthService, verifyBcryptPassword, authError };
