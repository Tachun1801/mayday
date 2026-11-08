const { recordScope, findAccessibleRecord: uploadRecord } = require('../clinical/record-access');
async function insertAttachment(client, recordId, accountId, filename, asset) {
  const { rows } = await client.query(`INSERT INTO public.tepdinhkem
    (ma_ho_so, ma_tai_khoan, ten_tep_goc, duong_dan_luu_tru, dinh_dang_tep, loai_phuong_tien, dung_luong_byte)
    VALUES ($1, $2, $3, $4, $5, 'image', $6) RETURNING ma_tep_dinh_kem::text AS id`,
  [recordId, accountId, filename, asset.locator, asset.format, asset.bytes]);
  if (!rows[0]) throw new Error('Attachment metadata was not persisted');
  return { id: rows[0].id, record_id: recordId };
}
async function confirmAttachment(pool, recordId, accountId, locator) {
  const { rows } = await pool.query(`SELECT ma_tep_dinh_kem::text AS id FROM public.tepdinhkem
    WHERE ma_ho_so = $1 AND ma_tai_khoan = $2 AND duong_dan_luu_tru = $3 LIMIT 2`, [recordId, accountId, locator]);
  return rows.length === 1 ? { id: rows[0].id, record_id: recordId } : null;
}
async function listAttachments(pool, principal, recordId, paging) {
  const values = [recordId], where = recordScope(principal, values);
  const from = `FROM public.tepdinhkem t JOIN public.hosobenhan h ON h.ma_ho_so = t.ma_ho_so WHERE h.ma_ho_so = $1 AND ${where}`;
  const count = await pool.query(`SELECT count(*)::text AS total ${from}`, values);
  const result = await pool.query(`SELECT t.ma_tep_dinh_kem::text AS id, t.ten_tep_goc, t.dinh_dang_tep,
    t.loai_phuong_tien, t.dung_luong_byte::text AS dung_luong_byte, t.thoi_diem_tao ${from}
    ORDER BY t.ma_tep_dinh_kem DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, paging.limit, paging.offset]);
  return { items: result.rows, total: Number(count.rows[0].total), page: paging.page, limit: paging.limit };
}
async function attachment(pool, principal, recordId, attachmentId) {
  const values = [recordId, attachmentId], where = recordScope(principal, values);
  const { rows } = await pool.query(`SELECT t.duong_dan_luu_tru AS locator FROM public.tepdinhkem t
    JOIN public.hosobenhan h ON h.ma_ho_so = t.ma_ho_so
    WHERE h.ma_ho_so = $1 AND t.ma_tep_dinh_kem = $2 AND ${where}`, values);
  return rows[0] || null;
}
module.exports = { uploadRecord, insertAttachment, confirmAttachment, listAttachments, attachment };
