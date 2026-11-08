const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app/app');
const { DEFAULT_ACTION_PERMISSIONS } = require('../src/config/auth');
const { scoreDate } = require('../src/modules/clinical/uas.service');

test('patient Web HTTP uses current grants and ownership; denies clinician/admin writes and wrong patient', async (t) => {
  const account = { account_id: '8', person_id: '11', patient_id: '11', staff_id: null, role_id: '4', branch_id: null,
    username: 'synthetic-patient', full_name: 'Synthetic Patient', is_active: true, password_hash: 'synthetic-private-hash', permissions: ['manage_medical_records', 'manage_users_v2'] };
  const calls = [], day = scoreDate(); let saved = false;
  const pool = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('a.mat_khau_ma_hoa AS password_hash')) return { rows: [account] };
      if (sql.includes('FROM public.benhnhan p JOIN public.nguoi')) {
        assert.deepEqual(values.slice(1, 3), ['11', null]);
        return { rows: values[0] === '11' ? [{ ma_benh_nhan: '11', ho_ten: 'Synthetic Patient' }] : [] };
      }
      if (sql.includes('FROM public.hosobenhan h WHERE h.ma_ho_so = $1')) {
        assert.match(sql, /h.ma_benh_nhan = \$2::bigint/); assert.equal(values[1], '11'); assert.equal(values[2], null);
        return { rows: values[0] === '21' ? [{ ma_ho_so: '21', ma_benh_nhan: '11', loai_benh_an: 'MAN', trang_thai: 'in_progress' }] : [] };
      }
      if (sql.includes('count(*)')) return { rows: [{ total: '0' }] };
      return { rows: [] };
    },
    async connect() {
      const client = {
        async query(sql, values) {
          calls.push({ sql, values });
          if (sql.includes('FOR UPDATE OF h')) {
            assert.match(sql, /h.ma_benh_nhan = \$2/); assert.equal(values[1], '11');
            return { rows: values[0] === '21' ? [{ status: 'in_progress' }] : [] };
          }
          if (sql.startsWith('INSERT INTO public.nhatkyuashangngay')) {
            assert.deepEqual(values, ['21', '11', day, 0, 3]);
            if (saved) throw Object.assign(new Error('synthetic private uniqueness detail'), { code: '23505' });
            saved = true; return { rows: [{ id: '91', ngay_cham_diem: day, diem_san_phu_hss: 0, diem_ngua_iss: 3, diem_uas_ngay: 3 }] };
          }
          return { rows: [] };
        }, release() {},
      }; return client;
    },
  };
  const server = createApp({ pool, authConfig: { jwtSecret: 'synthetic-patient-http-signing-secret', passwordVerifier: async () => true, actionPermissions: DEFAULT_ACTION_PERMISSIONS } }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: account.username, password: 'synthetic-password' }) });
  assert.equal(login.status, 200);
  const credentials = (await login.json()).data;
  assert.equal(credentials.user_info.patient_id, '11'); assert.equal(credentials.user_info.staff_id, null);
  const headers = { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' };
  const get = (path) => fetch(`${base}${path}`, { headers });
  const write = (path, body, method = 'POST') => fetch(`${base}${path}`, { method, headers, body: JSON.stringify(body) });
  assert.equal((await get('/auth/me')).status, 200);
  assert.equal((await get('/patients/11/medical-records')).status, 200);
  for (const suffix of ['', '/medical-records', '/uas']) assert.equal((await get(`/patients/12${suffix}`)).status, 404);
  assert.equal((await get('/medical-records/21')).status, 200);
  for (const suffix of ['', '/visits', '/prescriptions', '/labs', '/attachments', '/lesions']) assert.equal((await get(`/medical-records/22${suffix}`)).status, 404);
  for (const path of ['/admin/accounts', '/admin/roles', '/facilities/rooms']) assert.equal((await get(path)).status, 403);
  assert.equal((await write('/medical-records/21/status', { status: 'completed' }, 'PATCH')).status, 403);
  assert.equal((await write('/medical-records/21/content', { record: { chan_doan_ban_dau_phong_kham: 'synthetic' } }, 'PATCH')).status, 403);
  const score = { ma_ho_so_man: '21', ngay_cham_diem: day, diem_san_phu_hss: 0, diem_ngua_iss: 3 };
  assert.equal((await write('/uas/daily', { ...score, ma_benh_nhan: '12' })).status, 400);
  assert.equal((await write('/uas/daily', { ...score, ma_ho_so_man: '22' })).status, 404);
  const success = await write('/uas/daily', score);
  assert.equal(success.status, 201); assert.equal((await success.json()).data.diem_uas_ngay, 3);
  const duplicate = await write('/uas/daily', score);
  assert.equal(duplicate.status, 409); assert.equal((await duplicate.json()).code, '5002');
  account.permissions = [];
  assert.equal((await get('/medical-records/21')).status, 403);
  assert.equal((await write('/uas/daily', score)).status, 403);
  assert.equal((await get('/auth/me')).status, 200);
  const writes = calls.filter(({ sql }) => /^(INSERT|UPDATE|DELETE)/.test(sql));
  assert.equal(writes.length, 2); assert.ok(writes.every(({ sql }) => sql.startsWith('INSERT INTO public.nhatkyuashangngay')));
});
