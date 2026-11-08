import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeRecord, dailyPayload, ownRecord, recordStatus, todayInVietnam } from '../src/features/patient-portal/portal.js'

test('portal ownership rejects other patients, malformed responses and unsafe identifiers including dual identities', () => {
  assert.equal(ownRecord({ ma_ho_so: '9007199254740993', ma_benh_nhan: '11' }, '11'), true)
  for (const record of [null, {}, { ma_ho_so: '21', ma_benh_nhan: '12' }, { ma_ho_so: '9223372036854775808', ma_benh_nhan: '11' }]) assert.equal(ownRecord(record, '11'), false)
  assert.equal(ownRecord({ ma_ho_so: '21', ma_benh_nhan: '11', assigned_to_current_doctor: true }, '12'), false)
  assert.equal(activeRecord({ trang_thai: 'draft' }), true)
  assert.equal(activeRecord({ trang_thai: 'in_progress' }), true)
  for (const status of ['completed', 'pending', 'cancelled', undefined]) assert.equal(activeRecord({ trang_thai: status }), false)
  assert.equal(recordStatus('completed'), 'Đã hoàn tất')
})

test('patient daily payload preserves zero and labels, rejects empty/out-of-range and has no client owner/generated fields', () => {
  assert.deepEqual(dailyPayload('21', '2026-11-07', '0', '3'), { ma_ho_so_man: '21', ngay_cham_diem: '2026-11-07', diem_san_phu_hss: 0, diem_ngua_iss: 3 })
  for (const score of ['', '-1', '4', '1.2', 'NaN', '00']) assert.throws(() => dailyPayload('21', '2026-11-07', score, '3'))
  assert.throws(() => dailyPayload('21 OR TRUE', '2026-11-07', '0', '3'))
  assert.equal(todayInVietnam(new Date('2026-11-06T17:00:00Z')), '2026-11-07')
  assert.equal(todayInVietnam(new Date('2026-11-06T16:59:59Z')), '2026-11-06')
})
