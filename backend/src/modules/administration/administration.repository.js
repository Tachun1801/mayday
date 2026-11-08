const QUERIES = Object.freeze({
  accounts: {
    from: 'public.taikhoan a JOIN public.nguoi n ON n.ma_nguoi = a.ma_nguoi JOIN public.nhanvien s ON s.ma_nhan_vien = a.ma_nguoi',
    columns: 'a.ma_tai_khoan::text AS account_id, a.ma_nguoi::text AS person_id, a.ten_dang_nhap AS username, n.ho_ten AS full_name, a.ma_vai_tro::text AS role_id, a.trang_thai_hoat_dong AS is_active, s.ma_chi_nhanh::text AS branch_id',
    order: 'a.ma_tai_khoan',
  },
  roles: {
    from: 'public.vaitro', columns: 'ma_vai_tro::text, ten_vai_tro, ten_hien_thi', order: 'ma_vai_tro',
  },
  permissions: {
    from: 'public.quyenhan', columns: 'ma_quyen_han::text, ten_quyen_han, nhom_quyen', order: 'ma_quyen_han',
  },
});

function createAdministrationRepository(pool) {
  return {
    async rolePermissions(roleId) {
      const { rows } = await pool.query(`SELECT q.ma_quyen_han::text, q.ten_quyen_han, q.nhom_quyen
        FROM public.vaitroquyenhan vq JOIN public.quyenhan q ON q.ma_quyen_han = vq.ma_quyen_han
        WHERE vq.ma_vai_tro = $1 ORDER BY q.ma_quyen_han LIMIT 1001`, [roleId]);
      if (rows.length > 1000) throw new Error('Role permission list exceeds supported limit');
      return { items: rows };
    },
    async list(resource, page, limit, principal) {
      // SQL identifiers come exclusively from this fixed internal catalogue.
      const query = QUERIES[resource];
      if (!query) throw new Error('Unsupported administration resource');
      // Derive branch from the authenticated staff identity in the database.
      // A caller-supplied branch must never widen the account directory.
      const scoped = resource === 'accounts';
      if (scoped && !principal?.staff_id) throw new Error('Staff identity required');
      const values = scoped ? [principal.staff_id] : [];
      const where = scoped ? ' WHERE s.ma_chi_nhanh = (SELECT actor.ma_chi_nhanh FROM public.nhanvien actor WHERE actor.ma_nhan_vien = $1)' : '';
      const [count, items] = await Promise.all([
        pool.query(`SELECT count(*)::text AS total FROM ${query.from}${where}`, values),
        pool.query(`SELECT ${query.columns} FROM ${query.from}${where} ORDER BY ${query.order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, (page - 1) * limit]),
      ]);
      return { items: items.rows, total: Number(count.rows[0].total), page, limit };
    },
  };
}

module.exports = { createAdministrationRepository };
