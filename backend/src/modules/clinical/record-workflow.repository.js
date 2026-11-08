async function lockAssignedRecord(client, recordId, staffId) {
  const { rows } = await client.query(`SELECT h.ma_ho_so::text AS id, h.trang_thai AS status,
    h.loai_benh_an, h.ma_benh_nhan::text AS patient_id
    FROM public.hosobenhan h
    WHERE h.ma_ho_so = $1 AND EXISTS (
      SELECT 1 FROM public.phienkham v
      WHERE v.ma_ho_so = h.ma_ho_so AND v.ma_bac_si = $2
    ) FOR UPDATE OF h`, [recordId, staffId]);
  return rows[0] || null;
}

async function updateAssignedStatus(client, recordId, staffId, previousStatus, status) {
  const { rows } = await client.query(`UPDATE public.hosobenhan h SET trang_thai = $4
    WHERE h.ma_ho_so = $1 AND h.trang_thai = $3 AND EXISTS (
      SELECT 1 FROM public.phienkham v
      WHERE v.ma_ho_so = h.ma_ho_so AND v.ma_bac_si = $2
    ) RETURNING h.ma_ho_so::text AS id, h.trang_thai AS status`,
  [recordId, staffId, previousStatus, status]);
  return rows[0] || null;
}

module.exports = { lockAssignedRecord, updateAssignedStatus };
