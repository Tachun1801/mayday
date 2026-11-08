const { recordScope } = require('./record-access');
const { HttpError } = require('../../shared/errors');

function scope(principal, values, patientColumn) {
  if (!principal?.patient_id && !principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
  values.push(principal.patient_id || null, principal.staff_id || null);
  const patient = `$${values.length - 1}::bigint`;
  const staff = `$${values.length}::bigint`;
  return `(${patientColumn} = ${patient} OR EXISTS (
    SELECT 1 FROM public.hosobenhan scope_h
    JOIN public.phienkham scope_v ON scope_v.ma_ho_so = scope_h.ma_ho_so
    WHERE scope_h.ma_benh_nhan = ${patientColumn} AND scope_v.ma_bac_si = ${staff}
  ))`;
}

function createClinicalRepository(pool) {
  async function list(select, from, where, values, order, paging) {
    const count = await pool.query(`SELECT count(*)::text AS total ${from} WHERE ${where}`, values);
    const result = await pool.query(`${select} ${from} WHERE ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, paging.limit, paging.offset]);
    return { items: result.rows, total: Number(count.rows[0].total), page: paging.page, limit: paging.limit };
  }

  async function patients(principal, paging, search) {
    const values = [];
    let where = scope(principal, values, 'p.ma_benh_nhan');
    if (search) {
      values.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
      where += ` AND (n.ho_ten ILIKE $${values.length} ESCAPE '\\' OR n.so_dien_thoai ILIKE $${values.length} ESCAPE '\\')`;
    }
    return list('SELECT p.*, n.ho_ten, n.ngay_sinh::text AS ngay_sinh, n.gioi_tinh, n.so_dien_thoai, n.dia_chi_tinh_tp, n.dia_chi_xa_phuong, n.dia_chi_so_nha_thon_pho, p.bhyt_gia_tri_den::text AS bhyt_gia_tri_den',
      'FROM public.benhnhan p JOIN public.nguoi n ON n.ma_nguoi = p.ma_benh_nhan', where, values, 'p.ma_benh_nhan', paging);
  }

  async function patient(principal, id) {
    const values = [id];
    const where = scope(principal, values, 'p.ma_benh_nhan');
    const result = await pool.query(`SELECT p.*, n.ho_ten, n.ngay_sinh::text AS ngay_sinh, n.gioi_tinh, n.so_dien_thoai, n.dia_chi_tinh_tp, n.dia_chi_xa_phuong, n.dia_chi_so_nha_thon_pho, p.bhyt_gia_tri_den::text AS bhyt_gia_tri_den
      FROM public.benhnhan p JOIN public.nguoi n ON n.ma_nguoi = p.ma_benh_nhan WHERE p.ma_benh_nhan = $1 AND ${where}`, values);
    return result.rows[0] || null;
  }

  async function facilities(principal, kind, paging) {
    if (!principal?.staff_id) throw new HttpError(403, '3101', 'Permission denied');
    const definitions = { branches: ['chinhanh', 'ma_chi_nhanh'], departments: ['khoaphong', 'ma_khoa_phong'], rooms: ['phongkham', 'ma_phong_kham'] };
    const [table, key] = definitions[kind];
    return list('SELECT f.*', `FROM public.${table} f`,
      'f.ma_chi_nhanh = (SELECT nv.ma_chi_nhanh FROM public.nhanvien nv WHERE nv.ma_nhan_vien = $1)', [principal.staff_id], `f.${key}`, paging);
  }

  async function records(principal, paging) {
    const values = [];
    const where = recordScope(principal, values);
    return list('SELECT h.*, h.ngay_bat_dau_dieu_tri_ngoai_tru::text AS ngay_bat_dau_dieu_tri_ngoai_tru, h.ngay_ket_thuc_dieu_tri_ngoai_tru::text AS ngay_ket_thuc_dieu_tri_ngoai_tru',
      'FROM public.hosobenhan h', where, values, 'h.ma_ho_so DESC', paging);
  }

  async function patientRecords(principal, patientId, paging) {
    const values = [patientId];
    const where = recordScope(principal, values);
    return list('SELECT h.*, h.ngay_bat_dau_dieu_tri_ngoai_tru::text AS ngay_bat_dau_dieu_tri_ngoai_tru, h.ngay_ket_thuc_dieu_tri_ngoai_tru::text AS ngay_ket_thuc_dieu_tri_ngoai_tru',
      'FROM public.hosobenhan h', `h.ma_benh_nhan = $1 AND ${where}`, values, 'h.ma_ho_so DESC', paging);
  }

  async function record(principal, id) {
    const values = [id];
    const where = recordScope(principal, values);
    const { rows } = await pool.query(`SELECT h.*, h.ngay_bat_dau_dieu_tri_ngoai_tru::text AS ngay_bat_dau_dieu_tri_ngoai_tru, h.ngay_ket_thuc_dieu_tri_ngoai_tru::text AS ngay_ket_thuc_dieu_tri_ngoai_tru,
      EXISTS (SELECT 1 FROM public.phienkham assigned_v WHERE assigned_v.ma_ho_so = h.ma_ho_so AND assigned_v.ma_bac_si = $${values.length}::bigint) AS assigned_to_current_doctor
      FROM public.hosobenhan h WHERE h.ma_ho_so = $1 AND ${where}`, values);
    if (!rows[0]) return null;
    const subtype = rows[0].loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman';
    const detail = await pool.query(`SELECT detail.* FROM public.${subtype} detail JOIN public.hosobenhan h ON h.ma_ho_so = detail.ma_ho_so WHERE h.ma_ho_so = $1 AND ${where}`, values);
    return { ...rows[0], chi_tiet: detail.rows[0] || null };
  }

  async function visits(principal, id, paging) {
    const values = [id];
    const where = recordScope(principal, values);
    return list('SELECT v.*, v.ngay_kham::text AS ngay_kham, v.ngay_hen_tai_kham::text AS ngay_hen_tai_kham',
      'FROM public.phienkham v JOIN public.hosobenhan h ON h.ma_ho_so = v.ma_ho_so', `h.ma_ho_so = $1 AND ${where}`, values, 'v.lan_kham_thu DESC, v.ma_phien_kham DESC', paging);
  }

  async function visit(principal, recordId, visitId) {
    const values = [recordId, visitId];
    const where = recordScope(principal, values);
    const { rows } = await pool.query(`SELECT v.*, v.ngay_kham::text AS ngay_kham,
      v.ngay_hen_tai_kham::text AS ngay_hen_tai_kham
      FROM public.phienkham v JOIN public.hosobenhan h ON h.ma_ho_so = v.ma_ho_so
      WHERE h.ma_ho_so = $1 AND v.ma_phien_kham = $2 AND ${where}`, values);
    if (!rows[0]) return null;
    const subtype = rows[0].loai_benh_an === 'CAP' ? 'phienkhamcap' : 'phienkhamman';
    const detail = await pool.query(`SELECT detail.* FROM public.${subtype} detail
      JOIN public.phienkham v ON v.ma_phien_kham = detail.ma_phien_kham
      JOIN public.hosobenhan h ON h.ma_ho_so = v.ma_ho_so
      WHERE h.ma_ho_so = $1 AND v.ma_phien_kham = $2 AND ${where}`, values);
    return { ...rows[0], chi_tiet: detail.rows[0] || null };
  }

  async function clinicalSection(principal, recordId, section, paging) {
    // Each identifier is fixed application code. A request can only choose a
    // known section; it never supplies a SQL table or column identifier.
    const sections = {
      'personal-history': ['tiensubanthan', 'ma_tien_su_ban_than', 'record'],
      'previous-episodes': ['benhsucacdotbenhtruoc', 'ma_tien_su', 'record'],
      'allergy-context': ['hoancanhkhoiphatdiung', 'ma_hoan_canh_khoi_phat', 'record'],
      infections: ['tinhtrangnhiemtrung', 'ma_tinh_trang_nhiem_trung', 'record'],
      vitals: ['dauhieusinhton', 'ma_dau_hieu_sinh_ton', 'visit'],
      'acute-lesions': ['chitiettonthuongcaptinh', 'ma_chi_tiet_ton_thuong_cap_tinh', 'visit'],
      'chronic-lesions': ['chitiettonthuongsanphu', 'ma_chi_tiet_ton_thuong', 'visit'],
    };
    if (!Object.hasOwn(sections, section)) throw new HttpError(400, '2003', 'Invalid clinical section');
    const [table, key, parent] = sections[section];
    const values = [recordId];
    const where = recordScope(principal, values);
    const from = parent === 'record'
      ? `FROM public.${table} detail JOIN public.hosobenhan h ON h.ma_ho_so = detail.ma_ho_so`
      : `FROM public.${table} detail JOIN public.phienkham v ON v.ma_phien_kham = detail.ma_phien_kham JOIN public.hosobenhan h ON h.ma_ho_so = v.ma_ho_so`;
    return list('SELECT detail.*', from, `h.ma_ho_so = $1 AND ${where}`, values, `detail.${key} DESC`, paging);
  }

  async function uas(principal, id, paging) {
    const values = [id];
    // Patient owners retain their whole history, including unlinked legacy
    // entries. Staff may only read scores linked to their assigned record.
    const where = recordScope(principal, values);
    return list('SELECT u.*, u.ngay_cham_diem::text AS ngay_cham_diem, u.ngay_bat_dau_chu_ky::text AS ngay_bat_dau_chu_ky',
      'FROM public.nhatkyuashangngay u LEFT JOIN public.hosobenhan h ON h.ma_ho_so = u.ma_ho_so_man AND h.ma_benh_nhan = u.ma_benh_nhan',
      `u.ma_benh_nhan = $1 AND (u.ma_benh_nhan = $2::bigint OR ${where})`, values, 'u.ngay_cham_diem DESC, u.ma_nhat_ky_uas DESC', paging);
  }

  async function prescriptions(principal, id, paging) {
    const values = [id];
    const where = recordScope(principal, values);
    const result = await list('SELECT d.*, d.ngay_ke_don::text AS ngay_ke_don',
      'FROM public.donthuoc d JOIN public.hosobenhan h ON h.ma_ho_so = d.ma_ho_so', `h.ma_ho_so = $1 AND ${where}`, values, 'd.ngay_ke_don DESC, d.ma_don_thuoc DESC', paging);
    if (result.items.length) {
      const childValues = [...values, result.items.map((row) => row.ma_don_thuoc)];
      const children = await pool.query(`SELECT item.*, COALESCE(drug.ten_thuoc, item.ten_thuoc_bo_sung) AS ten_thuoc FROM public.chitietdonthuoc item LEFT JOIN public.thuoc drug ON drug.ma_thuoc = item.ma_thuoc JOIN public.donthuoc d ON d.ma_don_thuoc = item.ma_don_thuoc JOIN public.hosobenhan h ON h.ma_ho_so = d.ma_ho_so WHERE h.ma_ho_so = $1 AND ${where} AND item.ma_don_thuoc = ANY($${childValues.length}::bigint[]) ORDER BY item.ma_chi_tiet_don_thuoc`, childValues);
      result.items = result.items.map((row) => ({ ...row, items: children.rows.filter((item) => String(item.ma_don_thuoc) === String(row.ma_don_thuoc)) }));
      const instructions = await pool.query(`SELECT instruction.*, instruction.ngung_tu_ngay::text AS ngung_tu_ngay
        FROM public.chidanngungthuoc instruction JOIN public.donthuoc d ON d.ma_don_thuoc = instruction.ma_don_thuoc
        JOIN public.hosobenhan h ON h.ma_ho_so = d.ma_ho_so
        WHERE h.ma_ho_so = $1 AND ${where} AND d.ma_don_thuoc = ANY($${childValues.length}::bigint[])
        ORDER BY instruction.ma_chi_dan_ngung`, childValues);
      result.items = result.items.map((row) => ({ ...row, stop_instructions: instructions.rows.filter((item) => String(item.ma_don_thuoc) === String(row.ma_don_thuoc)) }));
    }
    return result;
  }

  async function labs(principal, id, paging) {
    const values = [id];
    const where = recordScope(principal, values);
    const result = await list('SELECT k.*',
      'FROM public.ketquacanlamsang k JOIN public.phienkham v ON v.ma_phien_kham = k.ma_phien_kham JOIN public.hosobenhan h ON h.ma_ho_so = v.ma_ho_so', `h.ma_ho_so = $1 AND ${where}`, values, 'k.ma_ket_qua_can_lam_sang DESC', paging);
    if (result.items.length) {
      const childValues = [...values, result.items.map((row) => row.ma_ket_qua_can_lam_sang)];
      const children = await Promise.all(['ketquacanlamsangcap', 'ketquacanlamsangman'].map((table) => pool.query(`SELECT detail.* FROM public.${table} detail JOIN public.ketquacanlamsang k ON k.ma_ket_qua_can_lam_sang = detail.ma_ket_qua_can_lam_sang JOIN public.phienkham v ON v.ma_phien_kham = k.ma_phien_kham JOIN public.hosobenhan h ON h.ma_ho_so = v.ma_ho_so WHERE h.ma_ho_so = $1 AND ${where} AND k.ma_ket_qua_can_lam_sang = ANY($${childValues.length}::bigint[])`, childValues)));
      const details = children.flatMap((child) => child.rows);
      result.items = result.items.map((row) => ({ ...row, chi_tiet: details.find((detail) => String(detail.ma_ket_qua_can_lam_sang) === String(row.ma_ket_qua_can_lam_sang)) || null }));
    }
    return result;
  }

  async function lesionEpisodes(principal, recordId, paging) {
    const values = [recordId], where = recordScope(principal, values);
    return list('SELECT e.*', 'FROM public.dottonthuongda e JOIN public.hosobenhan h ON h.ma_ho_so = e.ma_ho_so_man',
      `h.ma_ho_so = $1 AND ${where}`, values, 'e.thoi_diem_xuat_hien DESC, e.ma_dot_ton_thuong_da DESC', paging);
  }

  async function lesionEpisode(principal, recordId, episodeId) {
    const values = [recordId, episodeId], where = recordScope(principal, values);
    const { rows } = await pool.query(`SELECT e.ma_dot_ton_thuong_da::text AS id FROM public.dottonthuongda e
      JOIN public.hosobenhan h ON h.ma_ho_so = e.ma_ho_so_man
      WHERE h.ma_ho_so = $1 AND e.ma_dot_ton_thuong_da = $2 AND ${where}`, values);
    return rows[0] || null;
  }

  async function lesionChildren(principal, recordId, episodeId, kind, paging) {
    const values = [recordId, episodeId], where = recordScope(principal, values);
    const isPhoto = kind === 'photos';
    const table = isPhoto ? 'anhchuptonthuong' : 'vitritonthuong';
    // Private object paths/URL columns are deliberately absent. Actual image
    // delivery remains gated on an authorized storage adapter.
    const columns = isPhoto
      ? 'a.ma_anh, a.ma_tep_dinh_kem, a.ma_vi_tri_ton_thuong, a.thoi_diem_chup, a.moc_tien_trien, a.diem_ngua_nrs, a.diem_dau_nrs, a.diem_bong_rat_nrs, a.so_luong_not_san, a.chi_so_auas_cuc_bo'
      : 'a.ma_vi_tri_ton_thuong, a.vi_tri_co_the, a.thoi_diem_xuat_hien, a.ten_thuoc_lien_quan';
    return list(`SELECT ${columns}`, `FROM public.${table} a JOIN public.dottonthuongda e ON e.ma_dot_ton_thuong_da = a.ma_dot_ton_thuong_da JOIN public.hosobenhan h ON h.ma_ho_so = e.ma_ho_so_man`,
      `h.ma_ho_so = $1 AND e.ma_dot_ton_thuong_da = $2 AND ${where}`, values, isPhoto ? 'a.thoi_diem_chup DESC, a.ma_anh DESC' : 'a.ma_vi_tri_ton_thuong', paging);
  }

  async function drugs(paging, search) {
    const values = [];
    let where = 'TRUE';
    if (search) {
      values.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
      where = "(t.ten_thuoc ILIKE $1 ESCAPE '\\' OR t.ma_thuoc ILIKE $1 ESCAPE '\\')";
    }
    return list('SELECT t.*', 'FROM public.thuoc t', where, values, 't.ma_thuoc', paging);
  }

  const whealCharacteristics = (paging) => list('SELECT d.*', 'FROM public.dacdiemsanphu d', 'TRUE', [], 'd.ma_dac_diem_san_phu', paging);
  return { patients, patient, patientRecords, facilities, records, record, visits, visit, clinicalSection, uas, prescriptions, labs, drugs, whealCharacteristics, lesionEpisodes, lesionEpisode, lesionChildren };
}

module.exports = { createClinicalRepository };
