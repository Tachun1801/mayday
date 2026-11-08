const { Pool } = require('pg');

// Created once by the entry point. pg opens connections only when queried.
function createDatabasePool(config) {
  if (!config.databaseEnabled || !config.databaseUrl) return null;
  const url = new URL(config.databaseUrl);
  // Enforce certificate verification even for a legacy sslmode=require URI.
  const disableTls = url.searchParams.get('sslmode') === 'disable';
  url.searchParams.delete('sslmode');
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: disableTls ? false : { rejectUnauthorized: true },
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    query_timeout: 10000,
  });
  pool.on('error', () => console.error('Idle database connection failed'));
  return pool;
}

module.exports = { createDatabasePool };
