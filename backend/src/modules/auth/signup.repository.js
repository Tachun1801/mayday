async function signupRole(client, roleId) {
  const { rows } = await client.query('SELECT ma_vai_tro::text AS id FROM public.vaitro WHERE ma_vai_tro = $1 FOR SHARE', [roleId]);
  return rows[0] || null;
}
async function insertPatientAccount(client, roleId, input, hash) {
  const person = await client.query(`INSERT INTO public.nguoi (ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh)
    VALUES ($1, $2, $3, $4) RETURNING ma_nguoi::text AS id`, [input.full_name, input.phone, input.birth_date, input.gender]);
  const patientId = person.rows[0].id;
  await client.query('INSERT INTO public.benhnhan (ma_benh_nhan) VALUES ($1)', [patientId]);
  const account = await client.query(`INSERT INTO public.taikhoan (ma_nguoi, ma_vai_tro, ten_dang_nhap, mat_khau_ma_hoa)
    VALUES ($1, $2, $3, $4) RETURNING ma_tai_khoan::text AS id`, [patientId, roleId, input.username, hash]);
  return { account_id: String(account.rows[0].id), patient_id: String(patientId) };
}
module.exports = { signupRole, insertPatientAccount };
