async function lockPatientRecord(client, recordId, patientId) {
  const { rows } = await client.query(`SELECT h.trang_thai AS status FROM public.hosobenhan h
    WHERE h.ma_ho_so = $1 AND h.ma_benh_nhan = $2 AND h.loai_benh_an = 'MAN' FOR UPDATE OF h`, [recordId, patientId]);
  return rows[0] || null;
}
async function insertDailyScore(client, recordId, patientId, input) {
  const { rows } = await client.query(`INSERT INTO public.nhatkyuashangngay
    (ma_ho_so_man, ma_benh_nhan, ngay_cham_diem, diem_san_phu_hss, diem_ngua_iss)
    VALUES ($1, $2, $3, $4, $5) RETURNING ma_nhat_ky_uas::text AS id,
    ngay_cham_diem::text AS ngay_cham_diem, diem_san_phu_hss, diem_ngua_iss, diem_uas_ngay`,
  [recordId, patientId, input.ngay_cham_diem, input.diem_san_phu_hss, input.diem_ngua_iss]);
  return rows[0];
}
module.exports = { lockPatientRecord, insertDailyScore };
