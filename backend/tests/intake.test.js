const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateIntake } = require('../src/modules/clinical/intake.validation');
const { createIntakeService } = require('../src/modules/clinical/intake.service');
function body(type = 'CAP', room = null) {
  return { patient: { ho_ten: ' Synthetic intake fixture ', so_dien_thoai: '0000000000', ngay_sinh: '2000-02-29', gioi_tinh: 'Nu' }, record: { loai_benh_an: type }, visit: { ngay_kham: '2026-11-06', ...(room ? { ma_phong_kham: room } : {}) } };
}
function fakeDatabase({ type = 'CAP', roomVisible = true, staffVisible = true, failOn = null, failCommit = false } = {}) {
  const state = { queries: [], released: 0, connections: 0, committed: false };
  const client = {
    async query(sql, values) {
      state.queries.push({ sql, values });
      if (failOn && sql.includes(failOn)) throw Object.assign(new Error('private fake SQL detail'), { code: '23503' });
      if (sql === 'COMMIT') {
        assert.ok(state.queries.some((q) => q.sql.includes(`INSERT INTO public.${type === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman'}`)));
        assert.ok(state.queries.some((q) => q.sql.includes(`INSERT INTO public.${type === 'CAP' ? 'phienkhamcap' : 'phienkhamman'}`)));
        if (failCommit) throw Object.assign(new Error('deferred FK fails at COMMIT'), { code: '23503' });
        state.committed = true;
      }
      if (sql.includes('FROM public.nhanvien')) return { rows: staffVisible ? [{ branch_id: '4' }] : [] };
      if (sql.includes('FROM public.phongkham')) return { rows: roomVisible ? [{ ma_phong_kham: '5' }] : [] };
      if (sql.includes('INSERT INTO public.nguoi ')) return { rows: [{ patient_id: '9007199254740993' }] };
      if (sql.includes('INSERT INTO public.hosobenhan ')) return { rows: [{ record_id: '9007199254740994', status: 'draft' }] };
      if (sql.includes('INSERT INTO public.phienkham\n')) return { rows: [{ visit_id: '9007199254740995' }] };
      return { rows: [] };
    },
    release() { state.released++; },
  };
  return { state, pool: { async connect() { state.connections++; return client; }, async query() { throw new Error('Transaction attempted pool.query instead of acquired client'); } } };
}
test('intake validates exact DDL fields and rejects mass assignment', () => {
  const result = validateIntake(body(), '2026-11-06');
  assert.equal(result.patient.ho_ten, 'Synthetic intake fixture');
  assert.equal(result.visit.ma_phong_kham, null);
  const cases = [
    { ...body(), patient_id: '1' },
    { ...body(), patient: { ...body().patient, ma_benh_nhan: '1' } },
    { ...body(), record: { loai_benh_an: 'CAP', trang_thai: 'completed' } },
    { ...body(), visit: { ...body().visit, ma_bac_si: '1' } },
    { ...body(), patient: { ...body().patient, gioi_tinh: 'Other' } },
    { ...body(), patient: { ...body().patient, so_dien_thoai: '+84000000000' } },
    { ...body(), patient: { ...body().patient, ngay_sinh: '2027-01-01' } },
    { ...body(), patient: { ...body().patient, ho_ten: ' ' } },
    { ...body(), patient: { ...body().patient, ho_ten: 'x'.repeat(151) } },
    { ...body(), visit: { ngay_kham: '2026-02-29' } },
    { ...body(), visit: { ngay_kham: '2026-13-01' } },
    { ...body(), visit: { ngay_kham: '0000-01-01' } },
    { ...body(), record: { loai_benh_an: 'OTHER' } },
    { ...body(), visit: { ngay_kham: '2026-11-06', ma_phong_kham: '1;DROP' } },
    { ...body(), patient: [] },
  ];
  for (const input of cases) assert.throws(() => validateIntake(input, '2026-11-06'), (error) => error.status === 400);
});
for (const type of ['CAP', 'MAN']) {
  test(`intake ${type} writes full deferred subtype graph through one client`, async () => {
    const { state, pool } = fakeDatabase({ type });
    const result = await createIntakeService(pool)({ staff_id: '7' }, body(type, '5'));
    assert.deepEqual(result, { patient_id: '9007199254740993', record_id: '9007199254740994', visit_id: '9007199254740995', status: 'draft' });
    assert.equal(state.connections, 1);
    assert.equal(state.released, 1);
    assert.equal(state.queries[0].sql, 'BEGIN');
    assert.equal(state.queries.at(-1).sql, 'COMMIT');
    assert.equal(state.committed, true);
    const room = state.queries.find((q) => q.sql.includes('FROM public.phongkham'));
    assert.deepEqual(room.values, ['5', '4']);
    assert.match(room.sql, /FOR SHARE/);
    const visit = state.queries.find((q) => q.sql.includes('INSERT INTO public.phienkham\n'));
    assert.deepEqual(visit.values, ['9007199254740994', '7', '5', type, '2026-11-06']);
    assert.match(visit.sql, /\$5, 1\)/);
    assert.ok(state.queries.every((q) => !q.sql.includes('Synthetic intake fixture') && !q.sql.includes('0000000000')));
    assert.ok(state.queries.every((q) => !/taikhoan|DROP |ALTER |TRUNCATE /i.test(q.sql)));
  });
}
test('intake denies patient/unknown staff and wrong-branch room before inserting', async () => {
  const absent = fakeDatabase();
  await assert.rejects(createIntakeService(absent.pool)({ patient_id: '1' }, body()), (error) => error.status === 403);
  assert.equal(absent.state.connections, 0);
  for (const settings of [{ staffVisible: false }, { roomVisible: false }]) {
    const { state, pool } = fakeDatabase(settings);
    await assert.rejects(createIntakeService(pool)({ staff_id: '7' }, body('CAP', '5')), (error) => error.status === 403);
    assert.ok(state.queries.every((q) => !q.sql.startsWith('INSERT')));
    assert.equal(state.queries.at(-1).sql, 'ROLLBACK');
    assert.equal(state.released, 1);
  }
});
test('intake invalid body does not acquire transaction connection', async () => {
  const { pool, state } = fakeDatabase();
  await assert.rejects(createIntakeService(pool)({ staff_id: '7' }, { ...body(), ma_bac_si: '8' }), (error) => error.status === 400);
  assert.equal(state.connections, 0);
});
test('intake partial write failure and deferred COMMIT failure both rollback', async () => {
  for (const settings of [{ failOn: 'INSERT INTO public.phienkhamcap' }, { failCommit: true }]) {
    const { state, pool } = fakeDatabase(settings);
    await assert.rejects(createIntakeService(pool)({ staff_id: '7' }, body()), (error) => error.status === 400 && error.code === '2003' && !error.message.includes('private'));
    assert.equal(state.committed, false);
    assert.equal(state.queries.at(-1).sql, 'ROLLBACK');
    assert.equal(state.released, 1);
    assert.equal(state.connections, 1);
  }
});
