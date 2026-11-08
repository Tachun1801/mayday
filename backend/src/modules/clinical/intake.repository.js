const { HttpError } = require('../../shared/errors');
async function insertIntake(client, staffId, input) {
  const staff = await client.query('SELECT ma_chi_nhanh::text AS branch_id FROM public.nhanvien WHERE ma_nhan_vien = $1 FOR SHARE', [staffId]);
  if (!staff.rows[0]) throw new HttpError(403, '3101', 'Permission denied');
  const roomId = input.visit.ma_phong_kham;
  if (roomId) {
    const room = await client.query('SELECT ma_phong_kham::text FROM public.phongkham WHERE ma_phong_kham = $1 AND ma_chi_nhanh = $2 FOR SHARE', [roomId, staff.rows[0].branch_id]);
    if (!room.rows[0]) throw new HttpError(403, '3101', 'Permission denied');
  }
  const patient = await client.query(`INSERT INTO public.nguoi (ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh)
    VALUES ($1, $2, $3, $4) RETURNING ma_nguoi::text AS patient_id`,
  [input.patient.ho_ten, input.patient.so_dien_thoai, input.patient.ngay_sinh, input.patient.gioi_tinh]);
  const patientId = patient.rows[0].patient_id;
  await client.query('INSERT INTO public.benhnhan (ma_benh_nhan) VALUES ($1)', [patientId]);
  const record = await client.query(`INSERT INTO public.hosobenhan (ma_benh_nhan, loai_benh_an)
    VALUES ($1, $2) RETURNING ma_ho_so::text AS record_id, trang_thai AS status`, [patientId, input.record.loai_benh_an]);
  const { record_id: recordId, status } = record.rows[0];
  if (status !== 'draft') throw new Error('Unexpected initial record state');
  const recordSubtype = input.record.loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman';
  await client.query(`INSERT INTO public.${recordSubtype} (ma_ho_so) VALUES ($1)`, [recordId]);
  const visit = await client.query(`INSERT INTO public.phienkham
    (ma_ho_so, ma_bac_si, ma_phong_kham, loai_benh_an, ngay_kham, lan_kham_thu)
    VALUES ($1, $2, $3, $4, $5, 1) RETURNING ma_phien_kham::text AS visit_id`,
  [recordId, staffId, roomId, input.record.loai_benh_an, input.visit.ngay_kham]);
  const visitId = visit.rows[0].visit_id;
  const visitSubtype = input.record.loai_benh_an === 'CAP' ? 'phienkhamcap' : 'phienkhamman';
  await client.query(`INSERT INTO public.${visitSubtype} (ma_phien_kham) VALUES ($1)`, [visitId]);
  return { patient_id: String(patientId), record_id: String(recordId), visit_id: String(visitId), status };
}
module.exports = { insertIntake };
