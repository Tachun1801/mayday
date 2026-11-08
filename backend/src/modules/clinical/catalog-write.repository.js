const definitions = Object.freeze({
  branches: { table: 'chinhanh', key: 'ma_chi_nhanh', fields: { ten_chi_nhanh: [150, true], dia_chi: [8000, true], so_dien_thoai: [20, false], trang_thai: ['boolean', true] }, create: false, branch: true },
  departments: { table: 'khoaphong', key: 'ma_khoa_phong', fields: { ten_khoa_phong: [150, true], loai_khoa: [50, true], mo_ta: [8000, false] }, create: true, branch: true },
  rooms: { table: 'phongkham', key: 'ma_phong_kham', fields: { ten_phong_kham: [150, true] }, create: true, branch: true },
  drugs: { table: 'thuoc', key: 'ma_thuoc', fields: { ten_thuoc: [255, true], hoat_chat: [255, false], nhom_dieu_tri: [100, false] }, create: true, branch: false },
  'wheal-characteristics': { table: 'dacdiemsanphu', key: 'ma_dac_diem_san_phu', fields: { ten_dac_diem: [150, true], mo_ta: [8000, false] }, create: true, branch: false },
});
function createCatalogWriteRepository(client) {
  return {
    async branch(staffId) {
      const { rows } = await client.query('SELECT ma_chi_nhanh::text AS id FROM public.nhanvien WHERE ma_nhan_vien = $1 FOR SHARE', [staffId]);
      return rows[0]?.id;
    },
    async save(kind, id, input, branchId) {
      const definition = definitions[kind], entries = Object.entries(input);
      if (id !== null) {
        const params = [id, ...entries.map(([, value]) => value)];
        const where = `${definition.key} = $1${definition.branch ? ` AND ma_chi_nhanh = $${params.push(branchId)}` : ''}`;
        const { rows } = await client.query(`UPDATE public.${definition.table} SET ${entries.map(([field], i) => `${field} = $${i + 2}`).join(', ')}
          WHERE ${where} RETURNING ${definition.key}::text AS id`, params);
        return rows[0] || null;
      }
      if (definition.branch) entries.push(['ma_chi_nhanh', branchId]);
      const { rows } = await client.query(`INSERT INTO public.${definition.table} (${entries.map(([key]) => key).join(', ')})
        VALUES (${entries.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING ${definition.key}::text AS id`, entries.map(([, value]) => value));
      return rows[0];
    },
  };
}
module.exports = { definitions, createCatalogWriteRepository };
