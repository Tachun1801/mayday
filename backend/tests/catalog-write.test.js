const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCatalogWriteService } = require('../src/modules/clinical/catalog-write.service');
function fixture({ branch = '9', found = true, failure = '' } = {}) {
  const calls = [], client = { async query(sql, values) {
    calls.push({ sql, values });
    if (failure && sql.startsWith(failure)) throw Object.assign(new Error('synthetic private error'), { code: '23505' });
    if (sql.startsWith('SELECT ma_chi_nhanh')) return { rows: branch ? [{ id: branch }] : [] };
    return { rows: /^(INSERT|UPDATE)/.test(sql) && found ? [{ id: '9007199254740993' }] : [] };
  }, release() { calls.push({ sql: 'release' }); } };
  return { calls, save: createCatalogWriteService({ async connect() { return client; } }) };
}
test('facility create injects branch, does not accept organization identifiers, and binds fields', async () => {
  const db = fixture(); await db.save({ staff_id: '7' }, 'departments', null, { ten_khoa_phong: 'Synthetic Department', loai_khoa: 'Synthetic type' });
  const insert = db.calls.find(({ sql }) => sql.startsWith('INSERT'));
  assert.match(insert.sql, /ma_chi_nhanh/); assert.equal(insert.values.at(-1), '9'); assert.ok(!insert.sql.includes('Synthetic'));
  for (const input of [{ ten_phong_kham: 'Synthetic', ma_chi_nhanh: '99' }, { ten_phong_kham: 'Synthetic', ma_khoa_phong: '22' }]) {
    const other = fixture(); await assert.rejects(other.save({ staff_id: '7' }, 'rooms', null, input), (error) => error.status === 400); assert.equal(other.calls.length, 0);
  }
});
test('facility updates retain branch scope and missing/wrong branch returns 404', async () => {
  const db = fixture(); await db.save({ staff_id: '7' }, 'rooms', '21', { ten_phong_kham: 'Synthetic Room' });
  const update = db.calls.find(({ sql }) => sql.startsWith('UPDATE')); assert.match(update.sql, /AND ma_chi_nhanh = \$3/); assert.deepEqual(update.values, ['21', 'Synthetic Room', '9']);
  const other = fixture({ found: false }); await assert.rejects(other.save({ staff_id: '7' }, 'rooms', '21', { ten_phong_kham: 'Synthetic Room' }), (error) => error.status === 404); assert.equal(other.calls.at(-2).sql, 'ROLLBACK');
});
test('catalog writes reject patient-only, unknown resources, branch creation and invalid drug groups', async () => {
  for (const [principal, kind, id, input] of [
    [{ patient_id: '7' }, 'rooms', null, { ten_phong_kham: 'Synthetic' }],
    [{ staff_id: '7' }, 'unknown; DROP', null, {}],
    [{ staff_id: '7' }, 'branches', null, { ten_chi_nhanh: 'Synthetic' }],
    [{ staff_id: '7' }, 'drugs', null, { ma_thuoc: 'SYNTHETIC', ten_thuoc: 'Synthetic', nhom_dieu_tri: 'invented' }],
  ]) { const db = fixture(); await assert.rejects(db.save(principal, kind, id, input), (error) => [400, 403].includes(error.status)); assert.equal(db.calls.length, 0); }
});
test('duplicate catalog keys map to conflict and roll back without raw SQL leakage', async () => {
  const db = fixture({ failure: 'INSERT' });
  await assert.rejects(db.save({ staff_id: '7' }, 'drugs', null, { ma_thuoc: 'SYNTHETIC', ten_thuoc: 'Synthetic' }), (error) => error.status === 409 && !error.message.includes('private'));
  assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
});
