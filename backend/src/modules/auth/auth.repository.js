const ACCOUNT_COLUMNS = `
  a.ma_tai_khoan::text AS account_id,
  a.ma_nguoi::text AS person_id,
  a.ten_dang_nhap AS username,
  a.mat_khau_ma_hoa AS password_hash,
  a.trang_thai_hoat_dong AS is_active,
  a.ma_vai_tro::text AS role_id,
  n.ho_ten AS full_name,
  n.so_dien_thoai AS phone,
  n.ngay_sinh::text AS birth_date,
  n.gioi_tinh AS gender,
  nv.ma_nhan_vien::text AS staff_id,
  nv.ma_chi_nhanh::text AS branch_id,
  bn.ma_benh_nhan::text AS patient_id,
  ARRAY(
    SELECT q.ten_quyen_han
    FROM public.vaitroquyenhan vq
    JOIN public.quyenhan q ON q.ma_quyen_han = vq.ma_quyen_han
    WHERE vq.ma_vai_tro = a.ma_vai_tro
    ORDER BY q.ten_quyen_han
  ) AS permissions`;
const ACCOUNT_FROM = `FROM public.taikhoan a
  JOIN public.nguoi n ON n.ma_nguoi = a.ma_nguoi
  LEFT JOIN public.nhanvien nv ON nv.ma_nhan_vien = a.ma_nguoi
  LEFT JOIN public.benhnhan bn ON bn.ma_benh_nhan = a.ma_nguoi`;

function createAuthRepository(pool) {
  return {
    async findByUsername(username) {
      const { rows } = await pool.query(`SELECT ${ACCOUNT_COLUMNS} ${ACCOUNT_FROM}
        WHERE lower(a.ten_dang_nhap) = lower($1) LIMIT 1`, [username]);
      return rows[0] || null;
    },
    async findByAccountId(accountId) {
      const { rows } = await pool.query(`SELECT ${ACCOUNT_COLUMNS} ${ACCOUNT_FROM}
        WHERE a.ma_tai_khoan = $1 LIMIT 1`, [accountId]);
      return rows[0] || null;
    },
    async updatePerson(personId, accountId, changes) {
      const columns = { full_name: 'ho_ten', phone: 'so_dien_thoai', birth_date: 'ngay_sinh', gender: 'gioi_tinh' };
      const fields = Object.keys(changes);
      if (!fields.length || !fields.every((field) => Object.hasOwn(columns, field))) {
        throw new Error('Invalid internal profile update');
      }
      const assignments = fields.map((field, index) => `${columns[field]} = $${index + 1}`);
      const values = fields.map((field) => changes[field]);
      const personIndex = values.push(personId);
      const accountIndex = values.push(accountId);
      const { rows } = await pool.query(`UPDATE public.nguoi SET ${assignments.join(', ')}
        WHERE ma_nguoi = $${personIndex}
          AND EXISTS (SELECT 1 FROM public.taikhoan a WHERE a.ma_tai_khoan = $${accountIndex}
            AND a.ma_nguoi = public.nguoi.ma_nguoi AND a.trang_thai_hoat_dong = true)
        RETURNING ma_nguoi::text AS person_id`, values);
      return rows[0] || null;
    },
    async changePassword(accountId, previousHash, replacementHash) {
      const { rows } = await pool.query(`UPDATE public.taikhoan SET mat_khau_ma_hoa = $1
        WHERE ma_tai_khoan = $2 AND mat_khau_ma_hoa = $3 AND trang_thai_hoat_dong = true
        RETURNING ma_tai_khoan::text AS account_id`, [replacementHash, accountId, previousHash]);
      return rows[0] || null;
    },
  };
}

module.exports = { createAuthRepository };
