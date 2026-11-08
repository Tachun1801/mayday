function createAdministrationWriteRepository(client) {
  return {
    async actor(accountId) {
      const { rows } = await client.query(`SELECT a.ma_tai_khoan::text AS account_id, a.ma_nguoi::text AS person_id,
        a.ma_vai_tro::text AS role_id, nv.ma_chi_nhanh::text AS branch_id
        FROM public.taikhoan a JOIN public.nhanvien nv ON nv.ma_nhan_vien = a.ma_nguoi
        WHERE a.ma_tai_khoan = $1 AND a.trang_thai_hoat_dong = true FOR SHARE OF a, nv`, [accountId]);
      return rows[0] || null;
    },
    async role(id, exclusive = false) {
      const { rows } = await client.query(`SELECT ma_vai_tro::text AS id FROM public.vaitro WHERE ma_vai_tro = $1 FOR ${exclusive ? 'UPDATE' : 'SHARE'}`, [id]);
      return rows[0] || null;
    },
    async permissions(roleId) {
      const { rows } = await client.query(`SELECT q.ma_quyen_han::text AS id, q.ten_quyen_han AS name
        FROM public.vaitroquyenhan vq JOIN public.quyenhan q ON q.ma_quyen_han = vq.ma_quyen_han
        WHERE vq.ma_vai_tro = $1 ORDER BY q.ma_quyen_han`, [roleId]);
      return rows;
    },
    async permissionIds(ids) {
      const { rows } = await client.query('SELECT ma_quyen_han::text AS id, ten_quyen_han AS name FROM public.quyenhan WHERE ma_quyen_han = ANY($1::bigint[]) FOR SHARE', [ids]);
      return rows;
    },
    async account(id, branchId) {
      const { rows } = await client.query(`SELECT a.ma_tai_khoan::text AS account_id, a.ma_nguoi::text AS person_id,
        a.ma_vai_tro::text AS role_id FROM public.taikhoan a JOIN public.nhanvien nv ON nv.ma_nhan_vien = a.ma_nguoi
        WHERE a.ma_tai_khoan = $1 AND nv.ma_chi_nhanh = $2 FOR UPDATE OF a`, [id, branchId]);
      return rows[0] || null;
    },
    async roleHasOtherScope(roleId, branchId) {
      const { rows } = await client.query(`SELECT EXISTS (SELECT 1 FROM public.taikhoan a
        LEFT JOIN public.nhanvien nv ON nv.ma_nhan_vien = a.ma_nguoi
        WHERE a.ma_vai_tro = $1 AND nv.ma_chi_nhanh IS DISTINCT FROM $2::bigint) AS outside_scope`, [roleId, branchId]);
      return rows[0]?.outside_scope !== false;
    },
    async createStaff(input, actor, hash) {
      const person = await client.query('INSERT INTO public.nguoi (ho_ten, so_dien_thoai) VALUES ($1, $2) RETURNING ma_nguoi::text AS id', [input.full_name, input.phone]);
      const personId = person.rows[0].id;
      await client.query('INSERT INTO public.nhanvien (ma_nhan_vien, ma_chi_nhanh) VALUES ($1, $2)', [personId, actor.branch_id]);
      const { rows } = await client.query(`INSERT INTO public.taikhoan (ma_nguoi, ma_vai_tro, ten_dang_nhap, mat_khau_ma_hoa)
        VALUES ($1, $2, $3, $4) RETURNING ma_tai_khoan::text AS account_id`, [personId, input.role_id, input.username, hash]);
      return { account_id: rows[0].account_id, person_id: personId };
    },
    async updateAccount(target, changes) {
      if (Object.hasOwn(changes, 'full_name')) await client.query('UPDATE public.nguoi SET ho_ten = $2 WHERE ma_nguoi = $1', [target.person_id, changes.full_name]);
      if (Object.hasOwn(changes, 'gender')) await client.query('UPDATE public.nguoi SET gioi_tinh = $2 WHERE ma_nguoi = $1', [target.person_id, changes.gender]);
      if (Object.hasOwn(changes, 'role_id')) await client.query('UPDATE public.taikhoan SET ma_vai_tro = $2 WHERE ma_tai_khoan = $1', [target.account_id, changes.role_id]);
      if (Object.hasOwn(changes, 'is_active')) await client.query('UPDATE public.taikhoan SET trang_thai_hoat_dong = $2 WHERE ma_tai_khoan = $1', [target.account_id, changes.is_active]);
      return { account_id: target.account_id };
    },
    async createRole(input) {
      const { rows } = await client.query('INSERT INTO public.vaitro (ten_vai_tro, ten_hien_thi, mo_ta_vai_tro) VALUES ($1, $2, $3) RETURNING ma_vai_tro::text AS role_id', [input.ten_vai_tro, input.ten_hien_thi, input.mo_ta_vai_tro]);
      return rows[0];
    },
    async replacePermissions(roleId, ids, personId) {
      await client.query('DELETE FROM public.vaitroquyenhan WHERE ma_vai_tro = $1', [roleId]);
      for (const id of ids) await client.query('INSERT INTO public.vaitroquyenhan (ma_vai_tro, ma_quyen_han, ma_nguoi_gan) VALUES ($1, $2, $3)', [roleId, id, personId]);
      return { role_id: roleId };
    },
  };
}
module.exports = { createAdministrationWriteRepository };
