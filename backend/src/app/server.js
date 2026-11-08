const { createApp } = require('./app');
const { readConfig } = require('../config/env');
const { readAuthConfig } = require('../config/auth');
const { createDatabasePool } = require('../database/pool');
const { readCloudinaryConfig } = require('../config/cloudinary');
const { createCloudinaryStorage } = require('../modules/media/cloudinary.client');

function startServer() {
  const config = readConfig();
  const authConfig = readAuthConfig();
  if (config.databaseEnabled && !authConfig.jwtSecret) throw new Error('JWT_SECRET is required when database APIs are enabled');
  const mediaStorage = config.databaseEnabled ? createCloudinaryStorage(readCloudinaryConfig()) : null;
  const pool = createDatabasePool(config);
  const server = createApp({ pool, authConfig, mediaStorage }).listen(config.port, config.host, () => {
    console.info(`Mayday API listening on port ${config.port}`);
  });
  server.on('error', async () => {
    console.error('HTTP server failed to start');
    try {
      if (pool) await pool.end();
    } catch {
      console.error('Database pool shutdown failed');
    } finally {
      process.exitCode = 1;
    }
  });
  let stopping = false;
  function shutdown() {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => {
      try {
        if (pool) await pool.end();
      } catch {
        console.error('Database pool shutdown failed');
        process.exitCode = 1;
      } finally {
        clearTimeout(deadline);
      }
    });
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

if (require.main === module) {
  try {
    startServer();
  } catch {
    console.error('Backend startup failed; check environment configuration');
    process.exitCode = 1;
  }
}

module.exports = { startServer };
