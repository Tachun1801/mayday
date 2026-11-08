const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { HttpError } = require('../src/shared/errors');
const { errorHandler } = require('../src/shared/http');
const { createClinicalRepository } = require('../src/modules/clinical/clinical.repository');
const { createClinicalService, serialize } = require('../src/modules/clinical/clinical.service');
const { createClinicalRouter } = require('../src/modules/clinical/clinical.routes');
const { identifier, pagination, keyword } = require('../src/modules/clinical/clinical.validation');

test('clinical input accepts precise bigint strings and bounds list requests', () => {
  assert.equal(identifier('9223372036854775807'), '9223372036854775807');
  for (const value of ['0', '-1', '9223372036854775808', '1 OR TRUE', ['1']]) {
    assert.throws(() => identifier(value), (error) => error.status === 400);
  }
  for (const query of [{ page: '0' }, { page: '1e5' }, { page: '1000001' }, { limit: '101' }, { limit: ['2'] }]) {
    assert.throws(() => pagination(query), (error) => error.status === 400);
  }
  assert.deepEqual(pagination({ page: '2', limit: '10' }), { page: 2, limit: 10, offset: 10 });
  assert.throws(() => keyword('x'.repeat(101)), (error) => error.status === 400);
  assert.deepEqual(serialize({ ma_ho_so: 100n, nested: { ma_nguoi: 200n } }), { ma_ho_so: '100', nested: { ma_nguoi: '200' } });
});

test('patient search is parameterized and scoped; wildcard characters are literal', async () => {
  const calls = [];
  const pool = { async query(text, values) {
    calls.push({ text, values });
    return text.includes('count(*)') ? { rows: [{ total: '1' }] } : { rows: [{ ma_benh_nhan: '9223372036854775807' }] };
  } };
  const repository = createClinicalRepository(pool);
  const result = await repository.patients({ patient_id: '123' }, pagination({}), "%' OR TRUE --");
  assert.equal(result.total, 1);
  assert.equal(result.items[0].ma_benh_nhan, '9223372036854775807');
  for (const call of calls) {
    assert.match(call.text, /p\.ma_benh_nhan = \$1::bigint/);
    assert.match(call.text, /scope_v\.ma_bac_si = \$2::bigint/);
    assert.doesNotMatch(call.text, /OR TRUE --/);
    assert.equal(call.values[0], '123');
    assert.equal(call.values[1], null);
    assert.equal(call.values[2], "%\\%' OR TRUE --%");
  }
});

test('record scope targets exact assigned record, not any record of same patient', async () => {
  let call;
  const repository = createClinicalRepository({ async query(text, values) { call = { text, values }; return { rows: [] }; } });
  const result = await repository.record({ staff_id: '77' }, '456');
  assert.equal(result, null);
  assert.match(call.text, /scope_v\.ma_ho_so = h\.ma_ho_so/);
  assert.match(call.text, /scope_v\.ma_bac_si = \$3::bigint/);
  assert.deepEqual(call.values, ['456', null, '77']);
  assert.doesNotMatch(call.text, /role|admin/i);
});

test('facilities forbid patient principals and derive staff branch from database', async () => {
  const calls = [];
  const repository = createClinicalRepository({ async query(text, values) {
    calls.push({ text, values }); return text.includes('count(*)') ? { rows: [{ total: '0' }] } : { rows: [] };
  } });
  await assert.rejects(repository.facilities({ patient_id: '1' }, 'rooms', pagination({})), (error) => error.status === 403);
  assert.equal(calls.length, 0);
  await repository.facilities({ staff_id: '9', branch_id: 'untrusted-test-value' }, 'rooms', pagination({}));
  for (const call of calls) {
    assert.match(call.text, /FROM public\.nhanvien nv WHERE nv\.ma_nhan_vien = \$1/);
    assert.equal(call.values[0], '9');
    assert.doesNotMatch(call.text, /department|khoa_phong/);
  }
});

test('UAS history scopes staff to the exact linked record and preserves owner legacy history', async () => {
  for (const principal of [{ staff_id: '7' }, { patient_id: '11' }]) {
    const calls = [];
    const repository = createClinicalRepository({ async query(text, values) {
      calls.push({ text, values }); return text.includes('count(*)') ? { rows: [{ total: '0' }] } : { rows: [] };
    } });
    await repository.uas(principal, '11', pagination({}));
    for (const call of calls) {
      assert.match(call.text, /LEFT JOIN public\.hosobenhan h ON h\.ma_ho_so = u\.ma_ho_so_man AND h\.ma_benh_nhan = u\.ma_benh_nhan/);
      assert.match(call.text, /u\.ma_benh_nhan = \$1 AND \(u\.ma_benh_nhan = \$2::bigint OR/);
      assert.match(call.text, /scope_v\.ma_ho_so = h\.ma_ho_so/);
      assert.deepEqual(call.values.slice(0, 3), ['11', principal.patient_id || null, principal.staff_id || null]);
      assert.doesNotMatch(call.text, /scope_h\.ma_benh_nhan/);
    }
  }
});

test('ID substitution blocks child reads and never runs child query', async () => {
  const calls = [];
  const service = createClinicalService({ async query(text, values) { calls.push({ text, values }); return { rows: [] }; } });
  for (const method of ['visits', 'prescriptions', 'labs']) {
    await assert.rejects(service[method]({ patient_id: '1' }, '2', pagination({})), (error) => error.status === 404 && error.code === '4001');
  }
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.text.includes('FROM public.hosobenhan h')));
  await assert.rejects(service.uas({ patient_id: '1' }, '2', pagination({})), (error) => error.status === 404);
  assert.ok(calls.every((call) => !call.text.includes('FROM public.nhatkyuashangngay')));
});

test('nested prescription items retain record scope and bigint identity', async () => {
  const calls = [];
  const repository = createClinicalRepository({ async query(text, values) {
    calls.push({ text, values });
    if (text.includes('count(*)')) return { rows: [{ total: '1' }] };
    if (text.startsWith('SELECT item.*')) {
      assert.match(text, /LEFT JOIN public\.thuoc drug ON drug\.ma_thuoc = item\.ma_thuoc/);
      assert.match(text, /COALESCE\(drug\.ten_thuoc, item\.ten_thuoc_bo_sung\) AS ten_thuoc/);
      return { rows: [{ ma_chi_tiet_don_thuoc: '9007199254740993', ma_don_thuoc: '9', ma_thuoc: 'SYNTHETIC', ten_thuoc: 'Synthetic catalog medicine' }] };
    }
    return { rows: [{ ma_don_thuoc: '9', ma_ho_so: '2' }] };
  } });
  const result = await repository.prescriptions({ staff_id: '3' }, '2', pagination({}));
  assert.equal(result.items[0].items[0].ma_chi_tiet_don_thuoc, '9007199254740993');
  assert.equal(result.items[0].items[0].ten_thuoc, 'Synthetic catalog medicine');
  const child = calls.at(-1);
  assert.match(child.text, /scope_v\.ma_ho_so = h\.ma_ho_so/);
  assert.match(child.text, /ANY\(\$4::bigint\[\]\)/);
  assert.deepEqual(child.values, ['2', null, '3', ['9']]);
});

test('clinical HTTP rejects missing auth/permissions and validates inputs before DB', async (t) => {
  let queries = 0;
  const app = express();
  const pool = { async query(text) { queries++; return text.includes('count(*)') ? { rows: [{ total: '0' }] } : { rows: [] }; } };
  const authenticate = (req, _res, next) => {
    if (!req.headers.authorization) return next(new HttpError(401, '3003', 'User not authenticated'));
    req.auth = { patient_id: '1' };
    next();
  };
  const authorize = () => (req, _res, next) => {
    if (req.headers.authorization === 'denied') return next(new HttpError(403, '3101', 'Permission denied'));
    next();
  };
  app.use('/api/v1', createClinicalRouter({ pool, authenticate, authorize }));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  assert.equal((await fetch(`${base}/patients`)).status, 401);
  assert.equal((await fetch(`${base}/patients`, { headers: { Authorization: 'denied' } })).status, 403);
  assert.equal((await fetch(`${base}/patients?limit=101`, { headers: { Authorization: 'allowed' } })).status, 400);
  assert.equal(queries, 0);
  const response = await fetch(`${base}/patients`, { headers: { Authorization: 'allowed' } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { code: '1000', message: 'OK', data: { items: [], total: 0, page: 1, limit: 20 } });
  const forbidden = await fetch(`${base}/facilities/branches`, { headers: { Authorization: 'allowed' } });
  assert.equal(forbidden.status, 403);
});
