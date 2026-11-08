const { createHash, randomUUID } = require('node:crypto');
const { MAX_IMAGE_BYTES, image } = require('./media.validation');
const ID = /^mayday\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function signature(params, secret) {
  return createHash('sha256').update(Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&') + secret).digest('hex');
}
function unavailable() { return new Error('Image storage operation failed'); }
async function boundedBody(response, max = MAX_IMAGE_BYTES) {
  if (!response.ok || !response.body) throw unavailable();
  const declared = response.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > max)) { await response.body.cancel(); throw unavailable(); }
  const reader = response.body.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > max) { await reader.cancel(); throw unavailable(); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  if (!length) throw unavailable();
  return Buffer.concat(chunks);
}
function createCloudinaryStorage(config, { fetchImpl = fetch, now = () => Math.floor(Date.now() / 1000) } = {}) {
  if (!config) return null;
  const { cloudName, apiKey, apiSecret } = config;
  const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image`;
  function locator(publicId, format) { return `cloudinary://${cloudName}/image/authenticated/${publicId}.${format}`; }
  function parse(value) {
    const prefix = `cloudinary://${cloudName}/image/authenticated/`;
    if (typeof value !== 'string' || !value.startsWith(prefix)) throw unavailable();
    const match = /^(mayday\/[0-9a-f-]+)\.(jpg|png|webp)$/.exec(value.slice(prefix.length));
    if (!match || !ID.test(match[1])) throw unavailable();
    return { publicId: match[1], format: match[2] };
  }
  async function signedPost(action, params, file) {
    const body = new FormData();
    for (const [key, value] of Object.entries(params)) body.set(key, String(value));
    body.set('api_key', apiKey); body.set('signature', signature(params, apiSecret));
    if (file) body.set('file', new Blob([file.buffer], { type: file.mime }), `image.${file.format}`);
    const response = await fetchImpl(`${base}/${action}`, { method: 'POST', body, redirect: 'error', signal: AbortSignal.timeout(30000) });
    const buffer = await boundedBody(response, 64 * 1024);
    return JSON.parse(buffer.toString('utf8'));
  }
  return {
    newId: () => `mayday/${randomUUID()}`,
    locator,
    async upload(buffer, info, publicId) {
      try {
        if (!ID.test(publicId)) throw unavailable();
        const result = await signedPost('upload', { timestamp: now(), public_id: publicId, type: 'authenticated', overwrite: 'false', allowed_formats: 'jpg,png,webp' }, { buffer, ...info });
        if (result.public_id !== publicId || result.type !== 'authenticated' || result.resource_type !== 'image' || result.format !== info.format || !Number.isSafeInteger(result.bytes) || result.bytes < 1 || result.bytes > MAX_IMAGE_BYTES) throw unavailable();
        return { locator: locator(publicId, result.format), format: result.format, bytes: result.bytes, mime: info.mime };
      } catch { throw unavailable(); }
    },
    async destroy(publicId) {
      try {
        if (!ID.test(publicId)) throw unavailable();
        const result = await signedPost('destroy', { timestamp: now(), public_id: publicId, type: 'authenticated', invalidate: 'true' });
        if (!['ok', 'not found'].includes(result.result)) throw unavailable();
      } catch { throw unavailable(); }
    },
    async download(value) {
      try {
        const { publicId, format } = parse(value);
        const params = { timestamp: now(), public_id: publicId, format, type: 'authenticated', attachment: 'false', expires_at: now() + 60 };
        const query = new URLSearchParams({ ...params, api_key: apiKey, signature: signature(params, apiSecret) });
        const response = await fetchImpl(`${base}/download?${query}`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
        const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        if (response.headers.get('content-type')?.split(';')[0].trim() !== mime) { await response.body?.cancel(); throw unavailable(); }
        const buffer = await boundedBody(response);
        image(buffer, mime);
        return { buffer, mime };
      } catch { throw unavailable(); }
    },
  };
}
module.exports = { createCloudinaryStorage, signature, boundedBody };
