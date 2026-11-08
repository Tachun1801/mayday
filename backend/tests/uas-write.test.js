const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDailyUasService } = require('../src/modules/clinical/uas.service');
function fixture({ status = 'in_progress', found = true, error } = {}) {
  const calls = [], client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE OF h')) { assert.deepEqual(values, ['21', '11']); assert.match(sql, /h\.loai_benh_an = 'MAN'/); return { rows: found ? [{ status }] : [] }; }
      if (sql.startsWith('INSERT')) {
        if (error) throw Object.assign(new Error('synthetic private data'), { code: error });
        return { rows: [{ id: '31', ngay_cham_diem: '2026-11-07', diem_san_phu_hss: 0, diem_ngua_iss: 3, diem_uas_ngay: 3 }] };
      }
      return { rows: [] };
    }, release() { calls.push({ sql: 'release' }); },
  };
  return { calls, save: createDailyUasService({ async connect() { return client; } }, { today: () => '2026-11-07' }) };
}
const input = { ma_ho_so_man: '21', ngay_cham_diem: '2026-11-07', diem_san_phu_hss: 0, diem_ngua_iss: 3 };
test('patient daily UAS derives ownership, retains HSS/ISS meanings and never writes generated values', async () => {
  const db = fixture(), result = await db.save({ patient_id: '11', staff_id: '99' }, input);
  assert.equal(result.diem_uas_ngay, 3);
  const insert = db.calls.find(({ sql }) => sql.startsWith('INSERT'));
  assert.deepEqual(insert.values, ['21', '11', '2026-11-07', 0, 3]);
  assert.doesNotMatch(insert.sql.split('RETURNING')[0], /diem_uas_ngay|ma_chu_ky/);
  assert.equal(db.calls.at(-2).sql, 'COMMIT');
});
test('UAS rejects non-patient, backfill, future, malformed scores and mass assignment before SQL', async () => {
  for (const body of [{ ...input, ngay_cham_diem: '2026-11-06' }, { ...input, ngay_cham_diem: '2026-11-08' }, { ...input, diem_ngua_iss: '3' }, { ...input, diem_ngua_iss: 4 }, { ...input, diem_san_phu_hss: -1 }, { ...input, ma_benh_nhan: '12' }, { ...input, note: 'unsupported' }]) {
    const db = fixture(); await assert.rejects(db.save({ patient_id: '11' }, body), (error) => error.status === 400); assert.equal(db.calls.length, 0);
  }
  const db = fixture(); await assert.rejects(db.save({ staff_id: '7' }, input), (error) => error.status === 403); assert.equal(db.calls.length, 0);
});
test('wrong patient, acute or non-writable record cannot receive UAS writes', async () => {
  for (const options of [{ found: false }, { status: 'completed' }, { status: 'pending' }, { status: 'cancelled' }]) {
    const db = fixture(options); await assert.rejects(db.save({ patient_id: '11' }, input), (error) => [404, 409].includes(error.status)); assert.ok(!db.calls.some(({ sql }) => sql.startsWith('INSERT')));
  }
});
test('UAS UNIQUE patient/day violation maps to 409/5002 and rolls back', async () => {
  const db = fixture({ error: '23505' }); await assert.rejects(db.save({ patient_id: '11' }, input), (error) => error.status === 409 && error.code === '5002'); assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
});
