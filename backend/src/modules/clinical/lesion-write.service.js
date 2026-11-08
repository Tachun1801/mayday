const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const { findAccessibleRecord } = require('./record-access');
const validate = require('./lesion-write.validation');
const repository = require('./lesion-write.repository');
function createLesionWriteService(pool) {
  async function run(principal, id, operation) {
    const recordId = identifier(id);
    if (!principal?.staff_id && !principal?.patient_id) throw new HttpError(403, '3101', 'Permission denied');
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    try {
      return await withTransaction(pool, async (client) => {
        const record = await findAccessibleRecord(client, recordId, principal, true);
        if (!record) throw new HttpError(404, '4001', 'Medical record not found');
        if (record.loai_benh_an !== 'MAN') throw new HttpError(400, '2003', 'Chronic medical record required');
        if (!['draft', 'in_progress'].includes(record.status)) throw new HttpError(409, record.status === 'completed' ? '4003' : '4009', 'Medical record is not writable');
        return operation(client, record);
      });
    } catch (error) {
      if (['23503', '23514', '23502', '22001', '22003'].includes(error.code)) throw new HttpError(400, '2003', 'Invalid lesion data');
      throw error;
    }
  }
  async function existingEpisode(client, recordId, episodeId) {
    if (!await repository.episode(client, recordId, episodeId)) throw new HttpError(404, '7001', 'Lesion episode not found');
  }
  return {
    createEpisode(principal, id, body) {
      const input = validate.episode(body);
      return run(principal, id, (client, record) => repository.insert(client, 'episode', { ma_benh_nhan: record.patient_id, ma_ho_so_man: id }, input));
    },
    createLocation(principal, id, episodeId, body) {
      identifier(episodeId); const input = validate.location(body);
      return run(principal, id, async (client) => {
        await existingEpisode(client, id, episodeId);
        return repository.insert(client, 'location', { ma_dot_ton_thuong_da: episodeId }, input);
      });
    },
    createPhoto(principal, id, episodeId, body) {
      identifier(episodeId); const input = validate.photo(body);
      return run(principal, id, async (client) => {
        await existingEpisode(client, id, episodeId);
        if (input.ma_vi_tri_ton_thuong && !await repository.location(client, episodeId, input.ma_vi_tri_ton_thuong)) throw new HttpError(404, '7002', 'Lesion location not found');
        if (!await repository.attachment(client, id, input.ma_tep_dinh_kem)) throw new HttpError(404, '6005', 'Image attachment not found');
        return repository.insert(client, 'photo', { ma_dot_ton_thuong_da: episodeId }, input);
      });
    },
    updatePhoto(principal, id, episodeId, photoId, body) {
      identifier(episodeId); identifier(photoId); const input = validate.photo(body, true);
      return run(principal, id, async (client) => {
        await existingEpisode(client, id, episodeId);
        const result = await repository.updatePhoto(client, id, episodeId, photoId, input);
        if (!result) throw new HttpError(404, '7003', 'Lesion photo not found');
        return result;
      });
    },
  };
}
module.exports = { createLesionWriteService };
