const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const { identifier } = require('./clinical.validation');
const { object, text, invalid } = require('./clinical-write.validation');
const { definitions, createCatalogWriteRepository } = require('./catalog-write.repository');
const drugGroups = ['Khang histamine H1 TH2', 'Sinh hoc/dich', 'Uc che mien dich', 'Corticosteroid toan than', 'Khac'];
function createCatalogWriteService(pool) {
  return async (principal, kind, id, body) => {
    if (!principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
    if (!Object.hasOwn(definitions, kind)) throw invalid();
    const definition = definitions[kind];
    if (id === null && !definition.create) throw invalid();
    if (id !== null) id = kind === 'drugs' ? text(id, 50, true) : identifier(id);
    object(body, [...Object.keys(definition.fields), ...(kind === 'drugs' && id === null ? ['ma_thuoc'] : [])]);
    if (!Object.keys(body).length) throw invalid();
    const input = {};
    if (kind === 'drugs' && id === null) input.ma_thuoc = text(body.ma_thuoc, 50, true);
    for (const [field, [max, required]] of Object.entries(definition.fields)) {
      if (id !== null && !Object.hasOwn(body, field)) continue;
      if (max === 'boolean') { if (typeof body[field] !== 'boolean') throw invalid(); input[field] = body[field]; }
      else input[field] = text(body[field], max, required);
    }
    if (kind === 'drugs' && input.nhom_dieu_tri != null && !drugGroups.includes(input.nhom_dieu_tri)) throw invalid();
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    try {
      return await withTransaction(pool, async (client) => {
        const repository = createCatalogWriteRepository(client), branchId = await repository.branch(identifier(String(principal.staff_id)));
        if (!branchId) throw new HttpError(403, '3101', 'Permission denied');
        const result = await repository.save(kind, id, input, branchId);
        if (!result) throw new HttpError(404, null, 'Catalogue resource not found');
        return result;
      });
    } catch (error) {
      if (error.code === '23505') throw new HttpError(409, '2003', 'Catalogue entry conflicts');
      if (['23503', '23514', '23502', '22001'].includes(error.code)) throw invalid();
      throw error;
    }
  };
}
module.exports = { createCatalogWriteService };
