const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { once } = require('node:events');
const express = require('express');
const { createClinicalWriteService } = require('../src/modules/clinical/clinical-write.service');
const { createRecordWorkflowService } = require('../src/modules/clinical/record-workflow.service');
const { createClinicalRouter } = require('../src/modules/clinical/clinical.routes');
const { errorHandler } = require('../src/shared/http');
const { HttpError } = require('../src/shared/errors');
const validate = require('../src/modules/clinical/clinical-write.validation');
const fields = require('../src/modules/clinical/clinical-fields');
const doctor = { staff_id: '7' }, id = '9007199254740993', visitId = '55';
function fixture({ type = 'CAP', status = 'in_progress', assigned = true, ownVisit = true, knownPatient = true, room = true, fail = '' } = {}) {
  const calls = [], committed = [];
  let tail = Promise.resolve(), current = status, visitNumber = 1;
  const pool = {
    async connect() {
      let unlock, original, number, staged = [];
      const client = {
        async query(sql, values) {
          calls.push({ sql, values, client });
          if (fail && sql.includes(fail)) throw Object.assign(new Error('synthetic private failure'), { code: fail === 'COMMIT' ? '23503' : '23514' });
          if (sql.includes('FOR UPDATE OF h')) {
            const previous = tail; tail = new Promise((resolve) => { unlock = resolve; }); await previous;
            original = current; number = visitNumber;
            assert.deepEqual(values, [id, '7']); assert.match(sql, /v\.ma_bac_si = \$2/);
            return { rows: assigned ? [{ id, status: current, loai_benh_an: type, patient_id: '11' }] : [] };
          }
          if (sql.includes('FOR UPDATE OF p')) { assert.match(sql, /v\.ma_bac_si = \$2/); return { rows: knownPatient ? [{ ma_benh_nhan: values[0] }] : [] }; }
          if (sql.includes('FOR UPDATE OF v')) { assert.deepEqual(values, [id, visitId, '7']); return { rows: ownVisit ? [{ id: visitId, loai_benh_an: type, ngay_kham: '2026-11-07' }] : [] }; }
          if (sql.startsWith('SELECT ma_chi_nhanh')) return { rows: [{ branch_id: '9' }] };
          if (sql.startsWith('SELECT ma_phong_kham')) return { rows: room ? [{ ma_phong_kham: '3' }] : [] };
          if (sql.startsWith('UPDATE public.hosobenhan h SET trang_thai')) { current = values[3]; return { rows: [{ id, status: current }] }; }
          if (/^(INSERT|UPDATE)/.test(sql)) {
            staged.push(sql);
            if (sql.startsWith('INSERT INTO public.hosobenhan')) return { rows: [{ record_id: id, status: 'draft' }] };
            if (sql.startsWith('INSERT INTO public.phienkham\n')) { visitNumber++; return { rows: [{ visit_id: String(visitNumber + 100) }] }; }
            return { rows: [{ ma_ket_qua_can_lam_sang: '66', ma_ho_so: id, ma_phien_kham: visitId, id: '88' }] };
          }
          if (sql === 'COMMIT') committed.push(...staged);
          if (sql === 'ROLLBACK') { if (original !== undefined) current = original; if (number !== undefined) visitNumber = number; staged = []; }
          return { rows: [] };
        },
        release() { calls.push({ sql: 'release', client }); if (unlock) unlock(); },
      };
      return client;
    },
    query() { assert.fail('Writes must use the acquired transaction client'); },
  };
  return { pool, calls, committed };
}
const writes = (db) => db.calls.filter(({ sql }) => /^(INSERT|UPDATE)/.test(sql));
const rx = { ngay_ke_don: '2026-11-07', items: [{ ten_thuoc_bo_sung: 'Synthetic medication', lieu_dung: 'Synthetic instructions', thoi_gian_dung: 'Synthetic duration' }] };
const cases = [
  ['addVisit', [id, { ngay_kham: '2026-11-07', ma_phong_kham: '3' }]],
  ['updateRecord', [id, { record: { chan_doan_tuyen_truoc: 'Synthetic observation' } }]],
  ['updateVisit', [id, visitId, { visit: { dan_do: 'Synthetic note' } }]],
  ['updateHistory', [id, 'allergy-context', { thuc_an_nghi_ngo: 'Synthetic context' }]],
  ['addVisitDetail', [id, visitId, 'vitals', { spo2: '0' }]],
  ['addLab', [id, visitId, { result: { wbc: '0.0000' }, detail: { lym: '1.2345' } }]],
  ['prescribe', [id, visitId, rx]],
];
test('writable allowlists contain actual non-generated clinical columns only', () => {
  const ddl = readFileSync(resolve(__dirname, '../../doc/mayday.sql'), 'utf8');
  for (const [table, definitions] of Object.entries(fields)) {
    const body = new RegExp(`CREATE TABLE public\\.${table} \\(([\\s\\S]*?)\\n\\);`).exec(ddl)?.[1]; assert.ok(body, table);
    for (const field of Object.keys(definitions)) {
      const line = new RegExp(`^    ${field} ([^\\n]+)`, 'm').exec(body)?.[1]; assert.ok(line, `${table}.${field}`); assert.doesNotMatch(line, /GENERATED/);
      assert.ok((!field.startsWith('ma_') || field === 'ma_his') && !['trang_thai', 'loai_benh_an'].includes(field));
    }
  }
});
test('validation rejects mass assignment, wrong types, impossible dates and precision loss', () => {
  for (const body of [{ ma_bac_si: '9' }, { ma_ho_so: id }, { trang_thai: 'completed' }, { thoi_gian_khoi_phat_tuan: 0.1 }, { thoi_gian_khoi_phat_tuan: 'Infinity' }, { thoi_gian_khoi_phat_tuan: '1e4' }, { thoi_gian_khoi_phat_tuan: '1.234' }, { da_dieu_tri_truoc_kham: 'false' }]) assert.throws(() => validate.patch('hosobenhan', body), (error) => error.status === 400);
  for (const value of ['2026-02-30', '0000-01-01', '2026-11-07T00:00:00Z']) assert.throws(() => validate.date(value));
  assert.deepEqual(validate.patch('ketquacanlamsang', { wbc: '0.0000' }), { wbc: '0.0000' });
  for (const [table, input] of [['ketquacanlamsangcap', { nlr: '1' }], ['phienkhamman', { diem_aas7: 12 }], ['benhanmaydayman', { chan_doan_chinh: 'invented' }], ['benhanmaydaycap', { thoi_gian_keo_dai_tb: '1; DROP TABLE' }]]) assert.throws(() => validate.patch(table, input));
  assert.deepEqual(validate.patch('benhanmaydaycap', { thoi_gian_keo_dai_tb: 'PT2H' }), { thoi_gian_keo_dai_tb: 'PT2H' });
});
for (const [method, args] of cases) {
  test(`${method}: same-client transaction locks parent before write`, async () => {
    const db = fixture(), result = await createClinicalWriteService(db.pool)[method](doctor, ...args);
    assert.ok(Object.values(result).includes(id));
    assert.ok(db.calls.findIndex(({ sql }) => /^(INSERT|UPDATE)/.test(sql)) > db.calls.findIndex(({ sql }) => sql.includes('FOR UPDATE OF h')));
    assert.equal(db.calls[0].sql, 'BEGIN'); assert.equal(db.calls.at(-2).sql, 'COMMIT'); assert.equal(db.calls.at(-1).sql, 'release');
    assert.ok(db.calls.every(({ client }) => client === db.calls[0].client));
    for (const { sql } of writes(db)) assert.doesNotMatch(sql, /Synthetic observation|Synthetic instructions|Synthetic note/);
  });
  test(`${method}: denies unassigned, patient-only, completed and legacy state without writes`, async () => {
    for (const options of [{ assigned: false }, { status: 'completed' }, { status: 'pending' }, { status: 'cancelled' }]) {
      const db = fixture(options);
      await assert.rejects(createClinicalWriteService(db.pool)[method]({ ...doctor, patient_id: '11' }, ...args), (error) => [404, 409].includes(error.status));
      assert.equal(writes(db).length, 0); assert.equal(db.calls.at(-2).sql, 'ROLLBACK');
    }
    const db = fixture(); await assert.rejects(createClinicalWriteService(db.pool)[method]({ patient_id: '11' }, ...args), (error) => error.status === 403); assert.equal(db.calls.length, 0);
  });
  test(`${method}: deferred COMMIT failure cannot report success`, async () => {
    const db = fixture({ fail: 'COMMIT' }); await assert.rejects(createClinicalWriteService(db.pool)[method](doctor, ...args), (error) => error.status === 400);
    assert.equal(db.calls.at(-2).sql, 'ROLLBACK'); assert.equal(db.committed.length, 0);
  });
}
test('visit-specific writers deny another doctor or wrong-record visit', async () => {
  for (const [method, args] of cases.filter(([name]) => ['updateVisit', 'addVisitDetail', 'addLab', 'prescribe'].includes(name))) {
    const db = fixture({ ownVisit: false }); await assert.rejects(createClinicalWriteService(db.pool)[method](doctor, ...args), (error) => error.status === 404); assert.equal(writes(db).length, 0);
  }
});
test('CAP/MAN labs complete deferred subtype graph and roll back partial failures', async () => {
  for (const type of ['CAP', 'MAN']) {
    const db = fixture({ type }); await createClinicalWriteService(db.pool).addLab(doctor, id, visitId, { result: { wbc: '0.0000' }, detail: {} });
    assert.deepEqual(writes(db)[0].values, [visitId, type, '0.0000']);
    assert.match(writes(db)[1].sql, new RegExp(`INSERT INTO public.ketquacanlamsang${type === 'CAP' ? 'cap' : 'man'}`)); assert.deepEqual(writes(db)[1].values, ['66']);
  }
  const db = fixture({ fail: 'INSERT INTO public.ketquacanlamsangcap' }); await assert.rejects(createClinicalWriteService(db.pool).addLab(doctor, id, visitId, { result: { wbc: '1' } })); assert.equal(db.committed.length, 0);
});
test('prescription XOR, required directions, stop-purpose detail and zero-day values', async () => {
  for (const items of [[], [{ ma_thuoc: 'A', ten_thuoc_bo_sung: 'B', lieu_dung: 'C', thoi_gian_dung: 'D' }], [{ lieu_dung: 'C', thoi_gian_dung: 'D' }], [{ ...rx.items[0], lieu_dung: '' }]]) assert.throws(() => validate.prescription({ ...rx, items }));
  assert.throws(() => validate.prescription({ ...rx, stop_instructions: [{ thuoc_can_ngung: 'Synthetic', muc_dich: 'Khac' }] }));
  const db = fixture(); await createClinicalWriteService(db.pool).prescribe(doctor, id, visitId, { ...rx, stop_instructions: [{ thuoc_can_ngung: 'Synthetic', thoi_gian_ngung_ngay: 0, muc_dich: 'Khac', muc_dich_khac_ghi_ro: 'Synthetic purpose' }] });
  assert.equal(writes(db).length, 3); assert.equal(writes(db)[2].values[3], 0);
});
test('existing-patient intake preserves identity and requires prior doctor assignment', async () => {
  for (const type of ['CAP', 'MAN']) {
    const db = fixture({ type }), result = await createClinicalWriteService(db.pool).existingIntake(doctor, '11', { record: { loai_benh_an: type }, visit: { ngay_kham: '2026-11-07' } });
    assert.equal(result.patient_id, '11'); assert.equal(result.status, 'draft'); assert.equal(writes(db).length, 4);
    assert.ok(!writes(db).some(({ sql }) => /INSERT INTO public\.(nguoi|benhnhan|taikhoan)\b/.test(sql)));
  }
  const db = fixture({ knownPatient: false }); await assert.rejects(createClinicalWriteService(db.pool).existingIntake(doctor, '11', { record: { loai_benh_an: 'CAP' }, visit: { ngay_kham: '2026-11-07' } }), (error) => error.status === 404); assert.equal(writes(db).length, 0);
});
test('wrong branch and wrong clinical subtype deny before creating data', async () => {
  const db = fixture({ room: false }); await assert.rejects(createClinicalWriteService(db.pool).addVisit(doctor, id, { ngay_kham: '2026-11-07', ma_phong_kham: '3' }), (error) => error.status === 403); assert.equal(writes(db).length, 0);
  for (const [method, args] of [['updateRecord', [id, { detail: { chan_doan_chinh: 'CSU' } }]], ['addVisitDetail', [id, visitId, 'chronic-lesions', { vi_tri: 'Synthetic' }]], ['updateHistory', [id, 'personal-history', { tien_su_co_dia: false }]]]) {
    const other = fixture(); await assert.rejects(createClinicalWriteService(other.pool)[method](doctor, ...args), (error) => error.status === 400); assert.equal(writes(other).length, 0);
  }
});
test('completion serializes with clinical child writes on the same parent lock', async () => {
  const db = fixture();
  const result = await Promise.allSettled([createRecordWorkflowService(db.pool)(doctor, id, { status: 'completed' }), createClinicalWriteService(db.pool).updateVisit(doctor, id, visitId, { visit: { dan_do: 'Synthetic' } })]);
  assert.equal(result[0].status, 'fulfilled'); assert.equal(result[1].status, 'rejected'); assert.equal(result[1].reason.status, 409); assert.ok(!writes(db).some(({ sql }) => sql.startsWith('UPDATE public.phienkham')));
});
test('competing follow-up visits serialize visit numbering with parent locks', async () => {
  const db = fixture(), service = createClinicalWriteService(db.pool);
  const results = await Promise.all([service.addVisit(doctor, id, { ngay_kham: '2026-11-07' }), service.addVisit(doctor, id, { ngay_kham: '2026-11-07' })]); assert.notEqual(results[0].visit_id, results[1].visit_id);
});
test('HTTP writes enforce auth/capability, reject injection and preserve envelope', async (t) => {
  const db = fixture(), app = express(); app.use(express.json());
  app.use('/api/v1', createClinicalRouter({ pool: db.pool,
    authenticate(req, _res, next) { if (!req.headers.authorization) return next(new HttpError(401, '3003', 'Not authenticated')); req.auth = doctor; next(); },
    authorize: () => (req, _res, next) => req.headers.authorization === 'allowed' ? next() : next(new HttpError(403, '3101', 'Permission denied')),
  })); app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1'); t.after(() => new Promise((resolve) => server.close(resolve))); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/v1/medical-records/${id}/content`;
  const send = (authorization, body) => fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) }, body: JSON.stringify(body) });
  assert.equal((await send(null, { record: { chan_doan_tuyen_truoc: 'Synthetic' } })).status, 401); assert.equal((await send('denied', { record: { chan_doan_tuyen_truoc: 'Synthetic' } })).status, 403); assert.equal(db.calls.length, 0);
  const response = await send('allowed', { record: { chan_doan_tuyen_truoc: 'Synthetic' } }); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { code: '1000', message: 'OK', data: { id } });
  assert.equal((await send('allowed', { record: { completed_at: 'Synthetic' } })).status, 400);
});

test('patient administration updates only verified assigned-active patient identity with a transaction', async () => {
  const calls = [], client = { async query(sql, values) {
    calls.push({ sql, values });
    if (sql.includes('FOR UPDATE OF h')) { assert.match(sql, /h\.ma_benh_nhan = \$1/); assert.match(sql, /h\.trang_thai IN \('draft', 'in_progress'\)/); assert.match(sql, /v\.ma_bac_si = \$2/); return { rows: [{ id: '21' }] }; }
    return { rows: [{ ma_nguoi: '11', ma_benh_nhan: '11' }] };
  }, release() {} };
  const service = createClinicalWriteService({ async connect() { return client; } });
  assert.deepEqual(await service.updatePatient(doctor, '11', { person: { dia_chi_tinh_tp: 'Synthetic City' }, patient: { ma_his: 'SYNTHETIC' } }), { patient_id: '11' });
  assert.equal(calls.at(-1).sql, 'COMMIT'); assert.equal(calls.filter(({ sql }) => sql.startsWith('UPDATE')).length, 2);
  assert.deepEqual(calls.find(({ sql }) => sql.startsWith('UPDATE public.nguoi')).values, ['11', 'Synthetic City']);
  await assert.rejects(service.updatePatient({ patient_id: '11' }, '11', { person: { ho_ten: 'Synthetic' } }), (error) => error.status === 403);
  await assert.rejects(service.updatePatient(doctor, '11', { patient: { ma_benh_nhan: '12' } }), (error) => error.status === 400);
});
