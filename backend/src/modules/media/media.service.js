const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { image, filename } = require('./media.validation');
const repository = require('./media.repository');
function id(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) throw new HttpError(400, '2003', 'Invalid identifier');
  return value;
}
function writable(record) {
  if (!record) throw new HttpError(404, '4001', 'Medical record not found');
  if (!['draft', 'in_progress'].includes(record.status)) throw new HttpError(409, record.status === 'completed' ? '4003' : '4009', 'Medical record is not writable');
}
const storageError = () => new HttpError(503, '9903', 'Image storage unavailable or upload outcome requires readback');
function createMediaService(pool, storage, { warn = () => console.warn('Image storage reconciliation required') } = {}) {
  function available() { if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable'); }
  async function cleanup(publicId) { try { await storage.destroy(publicId); } catch { warn(); } }
  return {
    async upload(principal, recordId, buffer, mime, encodedName) {
      id(recordId);
      if (!principal?.account_id || (!principal.patient_id && !principal.staff_id)) throw new HttpError(403, '3101', 'Permission denied');
      const accountId = id(String(principal.account_id));
      const info = image(buffer, mime), original = filename(encodedName, info.format);
      available();
      writable(await repository.uploadRecord(pool, recordId, principal));
      if (!storage) throw storageError();
      const publicId = storage.newId();
      let asset;
      try { asset = await storage.upload(buffer, info, publicId); }
      catch { warn(); await cleanup(publicId); throw storageError(); }
      let metadataReady = false;
      try {
        return await withTransaction(pool, async (client) => {
          // Upload is outside the transaction. Recheck under the same parent
          // lock used by clinical completion before persisting any metadata.
          writable(await repository.uploadRecord(client, recordId, principal, true));
          const result = await repository.insertAttachment(client, recordId, accountId, original, asset);
          metadataReady = true;
          return result;
        });
      } catch (error) {
        if (metadataReady) {
          // COMMIT may have succeeded despite a lost response. Do not destroy
          // an object that may now be referenced, even if readback is absent.
          try { const result = await repository.confirmAttachment(pool, recordId, accountId, asset.locator); if (result) return result; } catch { /* Preserve private object for reconciliation. */ }
          warn(); throw storageError();
        }
        await cleanup(publicId);
        if (['23503', '23514', '23502', '22001'].includes(error.code)) throw new HttpError(400, '2003', 'Invalid attachment metadata');
        throw error;
      }
    },
    async list(principal, recordId, paging) {
      id(recordId); available();
      if (!await repository.uploadRecord(pool, recordId, principal)) throw new HttpError(404, '4001', 'Medical record not found');
      return repository.listAttachments(pool, principal, recordId, paging);
    },
    async download(principal, recordId, attachmentId) {
      id(recordId); id(attachmentId); available();
      const row = await repository.attachment(pool, principal, recordId, attachmentId);
      if (!row) throw new HttpError(404, '6005', 'Image attachment not found');
      if (!storage) throw storageError();
      try { return await storage.download(row.locator); } catch { throw storageError(); }
    },
  };
}
module.exports = { createMediaService };
