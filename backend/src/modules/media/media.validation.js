const { HttpError } = require('../../shared/errors');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const invalidImage = () => new HttpError(400, '6002', 'Unsupported or invalid image');
function image(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new HttpError(400, '6001', 'Image file is required');
  if (buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, '6003', 'Image file size exceeds limit');
  if (!Object.hasOwn(types, mime)) throw invalidImage();
  let width = 0, height = 0;
  if (mime === 'image/png') {
    if (buffer.length < 45 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR' || buffer.toString('ascii', buffer.length - 8, buffer.length - 4) !== 'IEND') throw invalidImage();
    width = buffer.readUInt32BE(16); height = buffer.readUInt32BE(20);
  } else if (mime === 'image/jpeg') {
    if (buffer.length < 16 || buffer.readUInt16BE(0) !== 0xffd8 || buffer.readUInt16BE(buffer.length - 2) !== 0xffd9) throw invalidImage();
    let offset = 2;
    while (offset + 4 <= buffer.length) {
      if (buffer[offset++] !== 0xff) throw invalidImage();
      while (buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) throw invalidImage();
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) throw invalidImage();
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 8) throw invalidImage();
        height = buffer.readUInt16BE(offset + 3); width = buffer.readUInt16BE(offset + 5);
      }
      offset += length;
    }
  } else {
    if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.readUInt32LE(4) + 8 !== buffer.length || buffer.toString('ascii', 8, 12) !== 'WEBP') throw invalidImage();
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') { if (buffer[20] & 2) throw invalidImage(); width = buffer.readUIntLE(24, 3) + 1; height = buffer.readUIntLE(27, 3) + 1; }
    else if (chunk === 'VP8L' && buffer[20] === 0x2f) { const bits = buffer.readUInt32LE(21); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
    else if (chunk === 'VP8 ' && buffer.toString('hex', 23, 26) === '9d012a') { width = buffer.readUInt16LE(26) & 0x3fff; height = buffer.readUInt16LE(28) & 0x3fff; }
    else throw invalidImage();
  }
  if (!width || !height || width > 16384 || height > 16384 || width * height > 40000000) throw invalidImage();
  return { format: types[mime], mime, bytes: buffer.length };
}
function filename(encoded, format) {
  if (!encoded) return `image.${format}`;
  let name;
  try { name = decodeURIComponent(encoded); } catch { throw invalidImage(); }
  if (typeof name !== 'string' || !name.trim() || [...name].length > 255 || /[\r\n\0/\\]/.test(name)) throw invalidImage();
  return name;
}
module.exports = { image, filename, MAX_IMAGE_BYTES, types };
