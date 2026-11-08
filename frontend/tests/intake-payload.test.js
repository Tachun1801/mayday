import { test } from 'node:test'
import assert from 'node:assert/strict'
import { intakePayload } from '../src/features/patients/intake-payload.js'

test('new intake payload allowlists inputs and leaves doctor/status/identity to the backend', () => {
  const result = intakePayload({
    ho_ten: '  Synthetic fixture  ', so_dien_thoai: ' 0000000000 ',
    ngay_sinh: '', gioi_tinh: '', loai_benh_an: 'CAP', ngay_kham: '2026-01-02', ma_phong_kham: '',
    ma_bac_si: '999', patient_id: '999', trang_thai: 'completed',
  })
  assert.deepEqual(result, {
    patient: { ho_ten: 'Synthetic fixture', so_dien_thoai: '0000000000' },
    record: { loai_benh_an: 'CAP' }, visit: { ngay_kham: '2026-01-02' },
  })
})

test('optional room ID remains a string and optional dates are not inferred', () => {
  const result = intakePayload({ ho_ten: 'Fixture', so_dien_thoai: '0000000000', ngay_sinh: '2000-01-01', gioi_tinh: 'Nu', loai_benh_an: 'MAN', ngay_kham: '2026-01-02', ma_phong_kham: '9007199254740993' })
  assert.equal(result.visit.ma_phong_kham, '9007199254740993')
  assert.equal(result.patient.ngay_sinh, '2000-01-01')
  assert.equal(result.patient.gioi_tinh, 'Nu')
})
