const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');
function readCloudinaryConfig(env = process.env, path = resolve(__dirname, '../../.env')) {
  let local = {};
  try {
    const content = readFileSync(path, 'utf8').trim();
    if (!/^postgres(?:ql)?:\/\//.test(content)) local = parseEnv(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // A parser error can contain private credential text.
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Cannot read image storage configuration');
    }
  }
  const values = { ...local, ...env };
  const cloudName = values.CLOUDINARY_CLOUD_NAME, apiKey = values.CLOUDINARY_API_KEY, apiSecret = values.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  if (!/^[a-z0-9_-]{1,100}$/i.test(cloudName) || [apiKey, apiSecret].some((value) => typeof value !== 'string' || !value.trim() || value.length > 1000 || /[\r\n\0]/.test(value))) throw new Error('Invalid image storage configuration');
  return Object.freeze({ cloudName, apiKey, apiSecret });
}
module.exports = { readCloudinaryConfig };
