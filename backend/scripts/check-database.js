const { readConfig } = require('../src/config/env');
const { createDatabasePool } = require('../src/database/pool');

// Fixed metadata only. No table contents, identities or connection details.
const METADATA_QUERY = `SELECT
  current_setting('server_version') AS server_version,
  current_setting('transaction_read_only') AS read_only,
  EXISTS (SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid() AND ssl) AS tls`;

function classifyError(error, stage) {
  if (error.code === '08P01' && /unsupported startup parameter/i.test(error.message || '')) {
    return 'unsupported_startup_parameter';
  }
  if (['28P01', '28000'].includes(error.code)) return 'authentication_failed';
  if (error.code === '3D000') return 'database_not_found';
  if (['EAI_AGAIN', 'ENOTFOUND'].includes(error.code)) return 'name_resolution_failed';
  if (['EPERM', 'EACCES'].includes(error.code)) return 'network_permission_denied';
  if (error.code === 'ECONNREFUSED') return 'connection_refused';
  if (['ENETUNREACH', 'EHOSTUNREACH'].includes(error.code)) return 'network_unreachable';
  if (error.code === '08P01') return 'protocol_error';
  if (error.code === 'ETIMEDOUT' || /(?:connection terminated due to connection timeout|connection timeout|query read timeout)/i.test(error.message || '')) {
    return 'timeout';
  }
  if (['DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID'].includes(error.code)) {
    return 'tls_verification_failed';
  }
  if (/server does not support ssl/i.test(error.message || '')) return 'tls_not_supported';
  return stage === 'configuration' ? 'configuration_error' : stage === 'query' ? 'query_failed' : 'connection_failed';
}

async function checkDatabase({ loadConfig = readConfig, makePool = createDatabasePool } = {}) {
  let pool;
  let client;
  let transactionOpen = false;
  let discardClient = false;
  let stage = 'configuration';
  let result;
  try {
    const config = loadConfig();
    if (!config.databaseEnabled) return { ok: false, reason: 'database_disabled' };
    pool = makePool(config);
    if (!pool) return { ok: false, reason: 'database_disabled' };
    stage = 'connection';
    client = await pool.connect();
    stage = 'query';
    await client.query('BEGIN READ ONLY');
    transactionOpen = true;
    const { rows } = await client.query(METADATA_QUERY);
    await client.query('ROLLBACK');
    transactionOpen = false;
    if (rows[0]?.read_only !== 'on') {
      result = { ok: false, reason: 'read_only_not_confirmed' };
    } else {
      result = {
        ok: true,
        serverVersion: rows[0].server_version,
        readOnly: true,
        tls: rows[0].tls === true,
      };
    }
  } catch (error) {
    result = { ok: false, reason: classifyError(error, stage) };
  } finally {
    if (transactionOpen) {
      try {
        await client.query('ROLLBACK');
      } catch {
        discardClient = true;
      }
    }
    try {
      if (client) client.release(discardClient);
    } catch {
      result = { ok: false, reason: 'cleanup_failed' };
    }
    try {
      if (pool) await pool.end();
    } catch {
      result = { ok: false, reason: 'cleanup_failed' };
    }
  }
  return result;
}

if (require.main === module) {
  checkDatabase().then((result) => {
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode = 1;
  }).catch(() => {
    console.error(JSON.stringify({ ok: false, reason: 'check_failed' }));
    process.exitCode = 1;
  });
}

module.exports = { checkDatabase, METADATA_QUERY };
