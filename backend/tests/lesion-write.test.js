const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLesionWriteService } = require('../src/modules/clinical/lesion-write.service');
const validate = require('../src/modules/clinical/lesion-write.validation');
function fixture({ found = true, status = 'in_progress', type = 'MAN', episode = true, location = true, attachment = true, failCommit = false } = {}) {
  const calls = [], client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE OF h')) { assert.match(sql, /h\.ma_benh_nhan = \$2::bigint OR EXISTS/); return { rows: found ? [{ id: '21', status, loai_benh_an: type, patient_id: '11' }] : [] }; }
      if (sql.startsWith('SELECT ma_dot_ton_thuong')) return { rows: episode ? [{ id: '22' }] : [] };
      if (sql.startsWith('SELECT ma_vi_tri')) { assert.deepEqual(values, ['22', '23']); return { rows: location ? [{ id: '23' }] : [] }; }
      if (sql.startsWith('SELECT ma_tep')) { assert.deepEqual(values, ['21', '31']); return { rows: attachment ? [{ id: '31' }] : [] }; }
      if (sql === 'COMMIT' && failCommit) throw Object.assign(new Error('synthetic private SQL'), { code: '23503' });
      return { rows: /^(INSERT|UPDATE)/.test(sql) ? [{ id: '24' }] : [] };
    }, release() { calls.push({ sql: 'release' }); },
  };
  return { calls, service: createLesionWriteService({ async connect() { return client; } }) };
}
const patient = { patient_id: '11' }, doctor = { staff_id: '7' };
const photo = { ma_tep_dinh_kem: '31', ma_vi_tri_ton_thuong: '23', thoi_diem_chup: '2026-11-07T09:00:00+07:00', moc_tien_trien: 'start', diem_ngua_nrs: 0, diem_dau_nrs: 10 };
test('lesion contracts reject fabricated owners/URLs/AI metrics, invalid dates and out-of-range NRS', () => {
  for (const body of [{ ...photo, ma_benh_nhan: '12' }, { ...photo, url_anh: 'https://private.invalid' }, { ...photo, chi_so_auas_cuc_bo: '1' }, { ...photo, diem_ngua_nrs: '2' }, { ...photo, diem_ngua_nrs: 11 }, { ...photo, moc_tien_trien: 'invented' }, { ...photo, thoi_diem_chup: '2026-02-30T00:00:00Z' }]) assert.throws(() => validate.photo(body));
  assert.throws(() => validate.episode({ ten_dot_ton_thuong_da: 'Synthetic', hoan_canh_xuat_hien: 'Khac' }));
  assert.throws(() => validate.location({ vi_tri_co_the: ' ' }));
  assert.deepEqual(validate.photo({ moc_tien_trien: 'peak', diem_ngua_nrs: null }, true), { moc_tien_trien: 'peak', diem_ngua_nrs: null });
});
test('episode writes derive patient/record and permit only scoped active MAN records', async () => {
  for (const principal of [patient, doctor]) {
    const db = fixture(); assert.deepEqual(await db.service.createEpisode(principal, '21', { ten_dot_ton_thuong_da: 'Synthetic episode' }), { id: '24' });
    const insert = db.calls.find(({ sql }) => sql.startsWith('INSERT')); assert.deepEqual(insert.values.slice(0, 2), ['11', '21']); assert.doesNotMatch(insert.sql, /Synthetic episode/); assert.equal(db.calls.at(-2).sql, 'COMMIT');
  }
  for (const options of [{ found: false }, { status: 'completed' }, { status: 'pending' }, { type: 'CAP' }]) {
    const db = fixture(options); await assert.rejects(db.service.createEpisode(patient, '21', { ten_dot_ton_thuong_da: 'Synthetic episode' }), (error) => [400, 404, 409].includes(error.status)); assert.ok(!db.calls.some(({ sql }) => sql.startsWith('INSERT')));
  }
});
test('photo and location must belong to exact episode/record; cross-record attachments are denied', async () => {
  const valid = fixture(); await valid.service.createPhoto(patient, '21', '22', photo); assert.ok(valid.calls.find(({ sql }) => sql.startsWith('SELECT ma_tep')).sql.includes("loai_phuong_tien = 'image'"));
  for (const options of [{ episode: false }, { location: false }, { attachment: false }]) {
    const db = fixture(options); await assert.rejects(db.service.createPhoto(patient, '21', '22', photo), (error) => error.status === 404); assert.ok(!db.calls.some(({ sql }) => sql.startsWith('INSERT')));
  }
  const location = fixture(); await location.service.createLocation(patient, '21', '22', { vi_tri_co_the: 'Synthetic location' }); assert.equal(location.calls.at(-2).sql, 'COMMIT');
});
test('photo patches preserve attachment linkage and verify attachment/record relationship inside UPDATE', async () => {
  const db = fixture(); await db.service.updatePhoto(doctor, '21', '22', '24', { moc_tien_trien: 'peak', diem_dau_nrs: 0 });
  const update = db.calls.find(({ sql }) => sql.startsWith('UPDATE')); assert.deepEqual(update.values, ['22', '24', '21', 'peak', 0]); assert.match(update.sql, /t\.ma_ho_so = \$3/); assert.ok(!update.sql.includes('SET ma_tep_dinh_kem'));
});
test('deferred COMMIT failure rolls back lesion creation without claiming success', async () => {
  const db = fixture({ failCommit: true }); await assert.rejects(db.service.createPhoto(patient, '21', '22', photo), (error) => error.status === 400); assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
});
