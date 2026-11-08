const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClinicalRepository } = require('../src/modules/clinical/clinical.repository');
const { createClinicalService } = require('../src/modules/clinical/clinical.service');
const paging = { page: 1, limit: 20, offset: 0 };
test('patient history retains exact record assignment even when patient has multiple doctors', async () => {
  const calls = [], repository = createClinicalRepository({ async query(sql, values) { calls.push({ sql, values }); return { rows: sql.includes('count(*)') ? [{ total: '0' }] : [] }; } });
  await repository.patientRecords({ staff_id: '7' }, '11', paging);
  for (const { sql, values } of calls) { assert.match(sql, /h\.ma_benh_nhan = \$1/); assert.match(sql, /scope_v\.ma_ho_so = h\.ma_ho_so/); assert.match(sql, /scope_v\.ma_bac_si = \$3/); assert.deepEqual(values.slice(0, 3), ['11', null, '7']); }
});
test('visit subtype queries bind both record and visit IDs and retain ownership scope', async () => {
  for (const type of ['CAP', 'MAN']) {
    const calls = [], repository = createClinicalRepository({ async query(sql, values) { calls.push({ sql, values }); return { rows: sql.includes('SELECT v.*') ? [{ ma_phien_kham: '55', loai_benh_an: type }] : [{ dan_do: 'Synthetic' }] }; } });
    assert.ok((await repository.visit({ staff_id: '7' }, '21', '55')).chi_tiet);
    assert.equal(calls.length, 2);
    for (const { sql, values } of calls) { assert.match(sql, /h\.ma_ho_so = \$1 AND v\.ma_phien_kham = \$2/); assert.match(sql, /scope_v\.ma_bac_si = \$4/); assert.deepEqual(values, ['21', '55', null, '7']); }
    assert.match(calls[1].sql, new RegExp(`public.phienkham${type === 'CAP' ? 'cap' : 'man'}`));
  }
});
test('clinical section identifiers are fixed allowlists, never request-provided SQL identifiers', async () => {
  const calls = [], repository = createClinicalRepository({ async query(sql, values) { calls.push({ sql, values }); return { rows: sql.includes('count(*)') ? [{ total: '0' }] : [] }; } });
  await assert.rejects(repository.clinicalSection({ staff_id: '7' }, '21', 'unknown; DROP', paging), (error) => error.status === 400); assert.equal(calls.length, 0);
  await repository.clinicalSection({ staff_id: '7' }, '21', 'vitals', paging);
  assert.ok(calls.every(({ sql }) => sql.includes('v.ma_ho_so') && sql.includes('scope_v.ma_ho_so = h.ma_ho_so')));
});
test('lesion child metadata is episode/record scoped and never selects private image URLs or paths', async () => {
  const calls = [], repository = createClinicalRepository({ async query(sql, values) { calls.push({ sql, values }); return { rows: sql.includes('count(*)') ? [{ total: '0' }] : [] }; } });
  await repository.lesionChildren({ staff_id: '7' }, '21', '22', 'photos', paging);
  for (const { sql, values } of calls) { assert.match(sql, /h\.ma_ho_so = \$1 AND e\.ma_dot_ton_thuong_da = \$2/); assert.match(sql, /scope_v\.ma_bac_si = \$4/); assert.doesNotMatch(sql, /url_anh|duong_dan|SELECT a\.\*/); assert.deepEqual(values.slice(0, 4), ['21', '22', null, '7']); }
});
test('child reads stop at absent or unauthorized parents', async () => {
  const calls = [], service = createClinicalService({ async query(sql) { calls.push(sql); return { rows: [] }; } });
  await assert.rejects(service.visit({ staff_id: '7' }, '21', '55'), (error) => error.status === 404);
  await assert.rejects(service.lesionChildren({ staff_id: '7' }, '21', '22', 'photos', paging), (error) => error.status === 404);
  await assert.rejects(service.clinicalSection({ staff_id: '7' }, '21', 'vitals', paging), (error) => error.status === 404);
  assert.equal(calls.length, 3); assert.ok(calls.every((sql) => sql.includes('SELECT h.*')));
});
