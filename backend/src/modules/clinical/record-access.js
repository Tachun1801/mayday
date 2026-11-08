// Public SQL scope contract for read/media resource queries. Assignment-only
// clinical writes keep the stricter record-workflow repository lock.
const { HttpError } = require('../../shared/errors');

function recordScope(principal, values, alias = 'h') {
  if (!principal?.patient_id && !principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
  values.push(principal.patient_id || null, principal.staff_id || null);
  return `(${alias}.ma_benh_nhan = $${values.length - 1}::bigint OR EXISTS (
    SELECT 1 FROM public.phienkham scope_v WHERE scope_v.ma_ho_so = ${alias}.ma_ho_so
    AND scope_v.ma_bac_si = $${values.length}::bigint))`;
}

async function findAccessibleRecord(db, recordId, principal, lock = false) {
  const values = [recordId], where = recordScope(principal, values);
  const { rows } = await db.query(`SELECT h.ma_ho_so::text AS id, h.trang_thai AS status,
    h.loai_benh_an, h.ma_benh_nhan::text AS patient_id FROM public.hosobenhan h
    WHERE h.ma_ho_so = $1 AND ${where}${lock ? ' FOR UPDATE OF h' : ''}`, values);
  return rows[0] || null;
}
module.exports = { recordScope, findAccessibleRecord };
