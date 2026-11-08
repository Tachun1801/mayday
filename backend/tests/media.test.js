const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { createMediaService } = require('../src/modules/media/media.service');
const { createMediaRouter } = require('../src/modules/media/media.routes');
const { createCloudinaryStorage, signature, boundedBody } = require('../src/modules/media/cloudinary.client');
const { image, filename, MAX_IMAGE_BYTES } = require('../src/modules/media/media.validation');
const { readCloudinaryConfig } = require('../src/config/cloudinary');
const { errorHandler } = require('../src/shared/http');
const { HttpError } = require('../src/shared/errors');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jLzQAAAAASUVORK5CYII=', 'base64');
const recordId = '21', publicId = 'mayday/12345678-1234-4234-8234-123456789abc';
const locator = `cloudinary://synthetic/image/authenticated/${publicId}.png`;
const principal = { account_id: '1', staff_id: '7' };
function fixture({ initial = 'in_progress', final = initial, found = true, uploadError = false, insertError = false, commitError = false, confirm = false, confirmError = false, cleanupError = false } = {}) {
  const calls = [], events = [];
  let warnings = 0;
  const storage = {
    newId: () => publicId,
    async upload(buffer, info, id) { events.push('upload'); assert.deepEqual(buffer, PNG); assert.equal(info.mime, 'image/png'); assert.equal(id, publicId); if (uploadError) throw new Error('private synthetic upload URL'); return { locator, format: 'png', bytes: PNG.length }; },
    async destroy(id) { events.push('destroy'); assert.equal(id, publicId); if (cleanupError) throw new Error('private synthetic cleanup URL'); },
    async download(value) { events.push('download'); assert.equal(value, locator); return { buffer: PNG, mime: 'image/png' }; },
  };
  const query = async (sql, values, inTransaction = false) => {
    calls.push({ sql, values, inTransaction });
    if (sql.includes('FROM public.hosobenhan h')) return { rows: found ? [{ id: recordId, status: inTransaction ? final : initial, loai_benh_an: 'MAN', patient_id: '11' }] : [] };
    if (sql.startsWith('INSERT INTO public.tepdinhkem')) { if (insertError) throw Object.assign(new Error('private synthetic SQL'), { code: '23503' }); assert.deepEqual(values, [recordId, '1', 'image.png', locator, 'png', PNG.length]); return { rows: [{ id: '31' }] }; }
    if (sql === 'COMMIT' && commitError) throw new Error('private synthetic COMMIT error');
    if (sql.includes('LIMIT 2')) { if (confirmError) throw new Error('private synthetic readback error'); return { rows: confirm ? [{ id: '31' }] : [] }; }
    if (sql.startsWith('SELECT t.duong_dan')) return { rows: found ? [{ locator }] : [] };
    if (sql.startsWith('SELECT count')) return { rows: [{ total: '0' }] };
    return { rows: [] };
  };
  const client = { query: (sql, values) => query(sql, values, true), release() { events.push('release'); } };
  const pool = { query, async connect() { return client; } };
  return { pool, storage, calls, events, warnings: () => warnings, service: createMediaService(pool, storage, { warn() { warnings++; } }) };
}

test('Cloudinary config supports private env/process precedence and never includes credentials in errors', () => {
  const missing = '/tmp/mayday-cloudinary-missing-env';
  assert.equal(readCloudinaryConfig({}, missing), null);
  assert.deepEqual(readCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: 'synthetic', CLOUDINARY_API_KEY: 'synthetic-key', CLOUDINARY_API_SECRET: 'synthetic-secret' }, missing), { cloudName: 'synthetic', apiKey: 'synthetic-key', apiSecret: 'synthetic-secret' });
  assert.throws(() => readCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: 'https://private-host', CLOUDINARY_API_KEY: 'secret', CLOUDINARY_API_SECRET: 'secret' }, missing), (error) => !/private-host|secret/.test(error.message));
});
test('image validation checks signature, content/MIME, byte limit, pixel limits and filenames', () => {
  assert.equal(image(PNG, 'image/png').format, 'png');
  for (const [buffer, mime] of [[PNG, 'image/jpeg'], [Buffer.from('<svg/>'), 'image/svg+xml'], [Buffer.alloc(0), 'image/png'], [PNG.subarray(0, 30), 'image/png']]) assert.throws(() => image(buffer, mime), (error) => error.status === 400);
  assert.throws(() => image(Buffer.alloc(MAX_IMAGE_BYTES + 1), 'image/png'), (error) => error.status === 413 && error.code === '6003');
  const oversized = Buffer.from(PNG); oversized.writeUInt32BE(20000, 16); assert.throws(() => image(oversized, 'image/png'));
  assert.equal(filename(encodeURIComponent('Ảnh tổng hợp.png'), 'png'), 'Ảnh tổng hợp.png');
  for (const name of ['..%2Fprivate.png', '%00secret.png', '%', 'line%0Abreak.png']) assert.throws(() => filename(name, 'png'));
});
test('Cloudinary REST upload is signed, authenticated, anonymous-named and never returns provider URLs', async () => {
  let sent;
  const config = { cloudName: 'synthetic', apiKey: 'synthetic-key', apiSecret: 'synthetic-secret' };
  const storage = createCloudinaryStorage(config, { now: () => 100, fetchImpl: async (url, options) => {
    sent = { url, options }; assert.equal(new URL(url).hostname, 'api.cloudinary.com'); assert.equal(new URL(url).protocol, 'https:');
    return Response.json({ public_id: publicId, type: 'authenticated', resource_type: 'image', format: 'png', bytes: PNG.length, secure_url: 'MUST_NOT_RETURN' });
  } });
  const result = await storage.upload(PNG, image(PNG, 'image/png'), publicId);
  assert.equal(sent.options.body.get('type'), 'authenticated'); assert.equal(sent.options.body.get('overwrite'), 'false');
  assert.equal(sent.options.body.get('file').name, 'image.png');
  assert.equal(sent.options.body.get('signature'), signature({ timestamp: 100, public_id: publicId, type: 'authenticated', overwrite: 'false', allowed_formats: 'jpg,png,webp' }, config.apiSecret));
  assert.doesNotMatch(JSON.stringify(result), /MUST_NOT_RETURN|synthetic-secret|api_key|signature/);
});
test('private download URL is short-lived, backend-only, fixed-host and bounded', async () => {
  let url;
  const storage = createCloudinaryStorage({ cloudName: 'synthetic', apiKey: 'synthetic-key', apiSecret: 'synthetic-secret' }, { now: () => 100, fetchImpl: async (value) => { url = new URL(value); return new Response(PNG, { headers: { 'content-type': 'image/png' } }); } });
  assert.equal((await storage.download(locator)).buffer.length, PNG.length);
  assert.equal(url.searchParams.get('expires_at'), '160'); assert.equal(url.searchParams.get('type'), 'authenticated');
  for (const value of ['https://untrusted.invalid/file.png', locator.replace('synthetic', 'other-cloud'), locator.replace(publicId, 'other/patient')]) await assert.rejects(storage.download(value));
  await assert.rejects(boundedBody(new Response(Buffer.alloc(5)), 4));
});
test('upload checks scope before provider and inserts metadata only after provider success under parent lock', async () => {
  const db = fixture(); assert.deepEqual(await db.service.upload(principal, recordId, PNG, 'image/png'), { id: '31', record_id: recordId });
  assert.equal(db.events[0], 'upload'); assert.equal(db.events.includes('destroy'), false);
  const insert = db.calls.findIndex(({ sql }) => sql.startsWith('INSERT')); assert.ok(db.calls.slice(0, insert).some(({ sql }) => sql.includes('FOR UPDATE OF h')));
  assert.equal(db.calls.at(-1).sql, 'COMMIT'); assert.ok(db.calls.filter(({ inTransaction }) => inTransaction).every(({ sql }) => !sql.includes('http')));
});
test('unassigned/non-owner and completed uploads never reach provider', async () => {
  for (const options of [{ found: false }, { initial: 'completed' }, { initial: 'cancelled' }]) {
    const db = fixture(options); await assert.rejects(db.service.upload(principal, recordId, PNG, 'image/png'), (error) => [404, 409].includes(error.status)); assert.equal(db.events.length, 0);
  }
});
test('completion during upload and metadata failure compensate only the new asset', async () => {
  for (const options of [{ final: 'completed' }, { insertError: true }]) {
    const db = fixture(options); await assert.rejects(db.service.upload(principal, recordId, PNG, 'image/png')); assert.ok(db.events.includes('destroy')); assert.equal(db.calls.at(-1).sql, 'ROLLBACK');
  }
});
test('lost COMMIT response requires readback and never destroys a possibly referenced object', async () => {
  const confirmed = fixture({ commitError: true, confirm: true }); assert.deepEqual(await confirmed.service.upload(principal, recordId, PNG, 'image/png'), { id: '31', record_id: recordId }); assert.ok(!confirmed.events.includes('destroy'));
  for (const options of [{ commitError: true }, { commitError: true, confirmError: true }]) {
    const db = fixture(options); await assert.rejects(db.service.upload(principal, recordId, PNG, 'image/png'), (error) => error.status === 503 && error.code === '9903'); assert.ok(!db.events.includes('destroy')); assert.equal(db.warnings(), 1);
  }
});
test('provider failure does not insert metadata or expose raw failure and cleanup failure is observable', async () => {
  const db = fixture({ uploadError: true, cleanupError: true }); await assert.rejects(db.service.upload(principal, recordId, PNG, 'image/png'), (error) => error.code === '9903' && !error.message.includes('private'));
  assert.ok(!db.calls.some(({ sql }) => sql.startsWith('INSERT'))); assert.ok(db.warnings() > 0);
});
test('metadata and binary reads bind both IDs/scope and hide private locator from JSON', async () => {
  const db = fixture(); await db.service.list(principal, recordId, { page: 1, limit: 20, offset: 0 });
  const selected = db.calls.find(({ sql }) => sql.startsWith('SELECT t.ma_tep')); assert.doesNotMatch(selected.sql, /duong_dan|url_anh/); assert.match(selected.sql, /scope_v.ma_bac_si = \$3/);
  await db.service.download(principal, recordId, '31'); const attachment = db.calls.find(({ sql }) => sql.startsWith('SELECT t.duong_dan'));
  assert.deepEqual(attachment.values, [recordId, '31', null, '7']);
  const missing = fixture({ found: false }); await assert.rejects(missing.service.download(principal, recordId, '31'), (error) => error.status === 404); assert.equal(missing.events.length, 0);
});
test('media HTTP accepts bounded raw images after auth and returns private bytes without signed redirects', async (t) => {
  const db = fixture(), app = express(); app.use(express.json());
  app.use('/api/v1/medical-records/:id/attachments', createMediaRouter({ pool: db.pool, mediaStorage: db.storage,
    authenticate(req, _res, next) { if (!req.headers.authorization) return next(new HttpError(401, '3003', 'Not authenticated')); req.auth = principal; next(); },
    authorize: () => (req, _res, next) => req.headers.authorization === 'allowed' ? next() : next(new HttpError(403, '3101', 'Permission denied')),
  })); app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1'); t.after(() => new Promise((resolve) => server.close(resolve))); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/medical-records/21/attachments`;
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await fetch(`${base}/31/content`, { headers: { Authorization: 'denied' } })).status, 403); assert.equal(db.calls.length, 0);
  const uploaded = await fetch(base, { method: 'POST', body: PNG, headers: { Authorization: 'allowed', 'Content-Type': 'image/png' } }); assert.equal(uploaded.status, 201); assert.deepEqual((await uploaded.json()).data, { id: '31', record_id: recordId });
  const downloaded = await fetch(`${base}/31/content`, { headers: { Authorization: 'allowed' } }); assert.equal(downloaded.status, 200); assert.equal(downloaded.headers.get('cache-control'), 'private, no-store'); assert.equal(downloaded.headers.get('location'), null); assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), PNG);
  assert.equal((await fetch(base, { method: 'POST', body: '<svg/>', headers: { Authorization: 'allowed', 'Content-Type': 'image/svg+xml' } })).status, 415);
  const oversized = await fetch(base, { method: 'POST', body: Buffer.alloc(MAX_IMAGE_BYTES + 1), headers: { Authorization: 'allowed', 'Content-Type': 'image/png' } }); assert.equal(oversized.status, 413); assert.equal((await oversized.json()).code, '6003');
});

test('image capacity is checked before buffering and remains held while aborted provider work settles', async (t) => {
  const db = fixture(), original = db.storage.upload;
  let releaseUpload, markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  db.storage.upload = async (...args) => { markStarted(); await new Promise((resolve) => { releaseUpload = resolve; }); return original(...args); };
  const app = express();
  app.use('/api/v1/medical-records/:id/attachments', createMediaRouter({ pool: db.pool, mediaStorage: db.storage,
    authenticate(req, _res, next) { req.auth = principal; next(); }, authorize: () => (_req, _res, next) => next(),
  })); app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => { releaseUpload?.(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/medical-records/21/attachments`;
  const controller = new AbortController();
  const first = fetch(base, { method: 'POST', body: PNG, signal: controller.signal, headers: { 'Content-Type': 'image/png' } }).catch(() => null);
  await started; controller.abort(); await first;
  const denied = await fetch(base, { method: 'POST', body: PNG, headers: { 'Content-Type': 'image/png' } });
  assert.equal(denied.status, 429); assert.equal(denied.headers.get('retry-after'), '2');
  assert.equal(db.events.length, 0);
  releaseUpload();
  for (let i = 0; i < 100 && !db.events.includes('release'); i++) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.ok(db.events.includes('release'));
  assert.equal((await fetch(`${base}/31/content`)).status, 200);
});
