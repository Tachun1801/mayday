const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');

function readConfig(env = process.env, filePath = resolve(__dirname, '../../.env')) {
  let local = {};
  try {
    const content = readFileSync(filePath, 'utf8').split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('#')).join('\n').trim();
    // Preserve the existing local URI file without rewriting or logging it.
    local = /^postgres(?:ql)?:\/\//.test(content)
      ? { DATABASE_URL: content }
      : parseEnv(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Do not retain a parser error that could contain private configuration.
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Cannot read backend environment configuration');
    }
  }
  const values = { ...local, ...env };
  const nodeEnv = values.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test or production');
  }
  const portText = values.PORT || '3000';
  if (!/^\d+$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const enabledText = values.DATABASE_ENABLED || 'false';
  if (!['true', 'false'].includes(enabledText)) throw new Error('DATABASE_ENABLED must be true or false');
  const databaseEnabled = enabledText === 'true';
  const databaseUrl = values.DATABASE_URL || undefined;
  if (databaseEnabled && !databaseUrl) throw new Error('DATABASE_URL is required when DATABASE_ENABLED=true');
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
        throw new Error();
      }
      // sslmode=disable is an explicit exception approved for the existing server.
      if (databaseEnabled && url.searchParams.has('sslmode') && !['disable', 'require', 'verify-full'].includes(url.searchParams.get('sslmode'))) {
        throw new Error();
      }
    } catch {
      throw new Error('DATABASE_URL must be a PostgreSQL URL; use sslmode=verify-full for TLS or explicitly approved sslmode=disable');
    }
  }
  return Object.freeze({ nodeEnv, host: values.HOST || '127.0.0.1', port: Number(portText), databaseEnabled, databaseUrl });
}

module.exports = { readConfig };
