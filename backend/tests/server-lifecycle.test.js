const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

test('HTTP startup failure handles a rejected pool cleanup without leaking details', () => {
  const script = `
    const { EventEmitter } = require('node:events');
    const server = new EventEmitter();
    require('./src/config/env').readConfig = () => ({ port: 3000, host: '127.0.0.1' });
    require('./src/config/auth').readAuthConfig = () => ({ jwtSecret: 'fixture-secret-'.repeat(4), actionPermissions: {} });
    require('./src/database/pool').createDatabasePool = () => ({
      end: async () => {
        console.log('pool cleanup attempted');
        throw new Error('private cleanup failure');
      },
    });
    require('./src/app/app').createApp = () => ({
      listen: () => {
        queueMicrotask(() => server.emit('error', new Error('private startup failure')));
        return server;
      },
    });
    process.on('unhandledRejection', () => {
      console.error('unhandled rejection');
      process.exitCode = 42;
    });
    require('./src/app/server').startServer();
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: resolve(__dirname, '..'),
    encoding: 'utf8',
    timeout: 5000,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), 'pool cleanup attempted');
  assert.match(result.stderr, /HTTP server failed to start/);
  assert.match(result.stderr, /Database pool shutdown failed/);
  assert.doesNotMatch(result.stderr, /unhandled rejection|private startup failure|private cleanup failure/);
});
