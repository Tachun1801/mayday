async function lookup(pool, input, roleId) {
  const { rows } = await pool.query(`SELECT p.ma_benh_nhan::text AS patient_id, n.ho_ten AS full_name,
    n.ngay_sinh::text AS birth_date, n.gioi_tinh AS gender
    FROM public.benhnhan p JOIN public.nguoi n ON n.ma_nguoi = p.ma_benh_nhan
    JOIN public.taikhoan a ON a.ma_nguoi = p.ma_benh_nhan
    WHERE lower(a.ten_dang_nhap) = lower($1) AND n.so_dien_thoai = $2
    AND a.ma_vai_tro = $3 AND a.trang_thai_hoat_dong = true
    AND NOT EXISTS (SELECT 1 FROM public.hosobenhan h WHERE h.ma_benh_nhan = p.ma_benh_nhan)
    LIMIT 1`, [input.username, input.phone, roleId]);
  return rows[0] || null;
}
async function lockCandidate(client, patientId, input, roleId) {
  const { rows } = await client.query(`SELECT p.ma_benh_nhan::text AS patient_id FROM public.benhnhan p
    JOIN public.nguoi n ON n.ma_nguoi = p.ma_benh_nhan JOIN public.taikhoan a ON a.ma_nguoi = p.ma_benh_nhan
    WHERE p.ma_benh_nhan = $1 AND lower(a.ten_dang_nhap) = lower($2) AND n.so_dien_thoai = $3
    AND a.ma_vai_tro = $4 AND a.trang_thai_hoat_dong = true FOR UPDATE OF p FOR SHARE OF a, n`,
  [patientId, input.username, input.phone, roleId]);
  return rows[0] || null;
}
async function hasRecords(client, patientId) {
  const { rows } = await client.query('SELECT EXISTS (SELECT 1 FROM public.hosobenhan WHERE ma_benh_nhan = $1) AS occupied', [patientId]);
  return rows[0]?.occupied !== false;
}
module.exports = { lookup, lockCandidate, hasRecords };
