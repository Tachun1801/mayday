const { HttpError } = require('../../shared/errors');
const { createClinicalRepository } = require('./clinical.repository');

function serialize(value, key = '') {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (key.startsWith('ma_') && typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map((item) => serialize(item));
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, serialize(item, name)]));
  return value;
}

function createClinicalService(pool) {
  const repository = pool ? createClinicalRepository(pool) : null;
  function available() {
    if (!repository) throw new HttpError(503, '9902', 'Database connection unavailable');
    return repository;
  }
  async function patient(principal, id) {
    const result = await available().patient(principal, id);
    if (!result) throw new HttpError(404, null, 'Patient not found');
    return serialize(result);
  }
  async function record(principal, id) {
    const result = await available().record(principal, id);
    if (!result) throw new HttpError(404, '4001', 'Medical record not found');
    return serialize(result);
  }
  async function recordList(method, principal, id, paging) {
    await record(principal, id);
    return serialize(await available()[method](principal, id, paging));
  }
  return {
    patient, record,
    patients: async (principal, paging, search) => serialize(await available().patients(principal, paging, search)),
    patientRecords: async (principal, id, paging) => {
      await patient(principal, id);
      return serialize(await available().patientRecords(principal, id, paging));
    },
    facilities: async (principal, kind, paging) => serialize(await available().facilities(principal, kind, paging)),
    records: async (principal, paging) => serialize(await available().records(principal, paging)),
    visits: (principal, id, paging) => recordList('visits', principal, id, paging),
    visit: async (principal, id, visitId) => {
      await record(principal, id);
      const result = await available().visit(principal, id, visitId);
      if (!result) throw new HttpError(404, '4001', 'Visit not found');
      return serialize(result);
    },
    clinicalSection: async (principal, id, section, paging) => {
      await record(principal, id);
      return serialize(await available().clinicalSection(principal, id, section, paging));
    },
    prescriptions: (principal, id, paging) => recordList('prescriptions', principal, id, paging),
    labs: (principal, id, paging) => recordList('labs', principal, id, paging),
    lesionEpisodes: (principal, id, paging) => recordList('lesionEpisodes', principal, id, paging),
    lesionChildren: async (principal, id, episodeId, kind, paging) => {
      if (!['locations', 'photos'].includes(kind)) throw new HttpError(400, '2003', 'Invalid lesion resource');
      await record(principal, id);
      if (!await available().lesionEpisode(principal, id, episodeId)) throw new HttpError(404, '4001', 'Lesion episode not found');
      return serialize(await available().lesionChildren(principal, id, episodeId, kind, paging));
    },
    uas: async (principal, id, paging) => {
      await patient(principal, id);
      return serialize(await available().uas(principal, id, paging));
    },
    drugs: async (paging, search) => serialize(await available().drugs(paging, search)),
    whealCharacteristics: async (paging) => serialize(await available().whealCharacteristics(paging)),
  };
}

module.exports = { createClinicalService, serialize };
