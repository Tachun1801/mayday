const { HttpError } = require('../../shared/errors');
const fields = require('./clinical-fields');

async function insertFields(client, table, fixed, input) {
  // Tables and fixed identifiers are selected by application code; user fields
  // must also belong to that table's fixed writable contract.
  if (!Object.hasOwn(fields, table)) throw new Error('Unknown clinical table');
  if (Object.keys(input).some((key) => !Object.hasOwn(fields[table], key))) throw new Error('Unknown clinical field');
  const entries = [...Object.entries(fixed), ...Object.entries(input)];
  const { rows } = await client.query(`INSERT INTO public.${table} (${entries.map(([key]) => key).join(', ')})
    VALUES (${entries.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, entries.map(([, value]) => value));
  return rows[0];
}
async function updateFields(client, table, key, id, input) {
  if (!Object.hasOwn(fields, table)) throw new Error('Unknown clinical table');
  const entries = Object.entries(input);
  if (!entries.length) return;
  if (entries.some(([field]) => !Object.hasOwn(fields[table], field))) throw new Error('Unknown clinical field');
  const result = await client.query(`UPDATE public.${table} SET ${entries.map(([field], i) => `${field} = $${i + 2}`).join(', ')}
    WHERE ${key} = $1 RETURNING ${key}`, [id, ...entries.map(([, value]) => value)]);
  if (!result.rows[0]) throw new HttpError(404, '4001', 'Clinical detail not found');
}
async function checkStaffRoom(client, staffId, roomId) {
  const staff = await client.query('SELECT ma_chi_nhanh::text AS branch_id FROM public.nhanvien WHERE ma_nhan_vien = $1 FOR SHARE', [staffId]);
  if (!staff.rows[0]) throw new HttpError(403, '3101', 'Permission denied');
  if (roomId) {
    const room = await client.query('SELECT ma_phong_kham FROM public.phongkham WHERE ma_phong_kham = $1 AND ma_chi_nhanh = $2 FOR SHARE', [roomId, staff.rows[0].branch_id]);
    if (!room.rows[0]) throw new HttpError(403, '3101', 'Permission denied');
  }
}
async function lockVisit(client, recordId, visitId, staffId) {
  const { rows } = await client.query(`SELECT v.ma_phien_kham::text AS id, v.loai_benh_an,
    v.ngay_kham::text AS ngay_kham FROM public.phienkham v
    WHERE v.ma_ho_so = $1 AND v.ma_phien_kham = $2 AND v.ma_bac_si = $3 FOR UPDATE OF v`, [recordId, visitId, staffId]);
  if (!rows[0]) throw new HttpError(404, '4001', 'Visit not found');
  return rows[0];
}
async function insertVisit(client, recordId, staffId, type, input) {
  await checkStaffRoom(client, staffId, input.ma_phong_kham);
  // The caller holds the parent record lock before reading MAX. The existing
  // UNIQUE(record, visit number) is still the final guard against other writers.
  const { rows } = await client.query(`INSERT INTO public.phienkham
    (ma_ho_so, ma_bac_si, ma_phong_kham, loai_benh_an, ngay_kham, lan_kham_thu)
    SELECT $1, $2, $3, $4, $5, COALESCE(MAX(lan_kham_thu), 0) + 1
    FROM public.phienkham WHERE ma_ho_so = $1 RETURNING ma_phien_kham::text AS visit_id`,
  [recordId, staffId, input.ma_phong_kham, type, input.ngay_kham]);
  const visitId = rows[0].visit_id;
  await insertFields(client, type === 'CAP' ? 'phienkhamcap' : 'phienkhamman', { ma_phien_kham: visitId }, {});
  return { visit_id: String(visitId) };
}

async function lockKnownPatient(client, id, staffId) {
  const { rows } = await client.query(`SELECT p.ma_benh_nhan FROM public.benhnhan p
    WHERE p.ma_benh_nhan = $1 AND EXISTS (SELECT 1 FROM public.hosobenhan h
    JOIN public.phienkham v ON v.ma_ho_so = h.ma_ho_so
    WHERE h.ma_benh_nhan = p.ma_benh_nhan AND v.ma_bac_si = $2) FOR UPDATE OF p`, [id, staffId]);
  return rows[0] || null;
}
async function insertRecord(client, patientId, type) {
  const { rows } = await client.query(`INSERT INTO public.hosobenhan (ma_benh_nhan, loai_benh_an)
    VALUES ($1, $2) RETURNING ma_ho_so::text AS record_id, trang_thai AS status`, [patientId, type]);
  return rows[0];
}
async function lockActivePatient(client, patientId, staffId) {
  const { rows } = await client.query(`SELECT h.ma_ho_so::text AS id FROM public.hosobenhan h
    WHERE h.ma_benh_nhan = $1 AND h.trang_thai IN ('draft', 'in_progress') AND EXISTS (
      SELECT 1 FROM public.phienkham v WHERE v.ma_ho_so = h.ma_ho_so AND v.ma_bac_si = $2
    ) ORDER BY h.ma_ho_so LIMIT 1 FOR UPDATE OF h`, [patientId, staffId]);
  return rows[0] || null;
}
async function historyRow(client, table, key, recordId) {
  if (!Object.hasOwn(fields, table)) throw new Error('Unknown clinical table');
  const { rows } = await client.query(`SELECT ${key}::text AS id FROM public.${table} WHERE ma_ho_so = $1 FOR UPDATE`, [recordId]);
  return rows[0] || null;
}
async function insertPrescription(client, recordId, visitId, input) {
  const { rows } = await client.query(`INSERT INTO public.donthuoc (ma_ho_so, ma_phien_kham, ngay_ke_don, ghi_chu_dieu_tri)
    VALUES ($1, $2, $3, $4) RETURNING ma_don_thuoc::text AS id`, [recordId, visitId, input.ngay_ke_don, input.ghi_chu_dieu_tri]);
  for (const item of input.items) await client.query(`INSERT INTO public.chitietdonthuoc
    (ma_don_thuoc, ma_thuoc, ten_thuoc_bo_sung, lieu_dung, thoi_gian_dung) VALUES ($1, $2, $3, $4, $5)`,
  [rows[0].id, item.ma_thuoc, item.ten_thuoc_bo_sung, item.lieu_dung, item.thoi_gian_dung]);
  for (const item of input.stop_instructions) await client.query(`INSERT INTO public.chidanngungthuoc
    (ma_don_thuoc, thuoc_can_ngung, ngung_tu_ngay, thoi_gian_ngung_ngay, muc_dich, muc_dich_khac_ghi_ro)
    VALUES ($1, $2, $3, $4, $5, $6)`,
  [rows[0].id, item.thuoc_can_ngung, item.ngung_tu_ngay, item.thoi_gian_ngung_ngay, item.muc_dich, item.muc_dich_khac_ghi_ro]);
  return rows[0].id;
}
module.exports = { insertFields, updateFields, checkStaffRoom, lockVisit, insertVisit, lockKnownPatient, insertRecord, historyRow, insertPrescription, lockActivePatient };
