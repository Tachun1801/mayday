const { invalid, object, text, date } = require('./clinical-write.validation');
const { identifier } = require('./clinical.validation');
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw invalid();
  date(value.slice(0, 10)); return value;
}
function context(body) {
  const result = {
    thoi_diem_xuat_hien: body.thoi_diem_xuat_hien == null ? null : timestamp(body.thoi_diem_xuat_hien),
    hoan_canh_xuat_hien: text(body.hoan_canh_xuat_hien, 255), hoan_canh_xuat_hien_khac: text(body.hoan_canh_xuat_hien_khac),
    thoi_gian_dung_thuoc_truoc_khi_xuat_hien: text(body.thoi_gian_dung_thuoc_truoc_khi_xuat_hien, 100), don_vi_thoi_gian: text(body.don_vi_thoi_gian, 50),
  };
  if (result.hoan_canh_xuat_hien === 'Khac' ? !result.hoan_canh_xuat_hien_khac?.trim() : result.hoan_canh_xuat_hien_khac !== null) throw invalid();
  return result;
}
const contextFields = ['thoi_diem_xuat_hien', 'hoan_canh_xuat_hien', 'hoan_canh_xuat_hien_khac', 'thoi_gian_dung_thuoc_truoc_khi_xuat_hien', 'don_vi_thoi_gian'];
function episode(body) {
  object(body, [...contextFields, 'ten_dot_ton_thuong_da', 'ten_thuoc_dung_gan_thoi_diem_xuat_hien', 'chi_tiet_dot_ton_thuong']);
  return { ...context(body), ten_dot_ton_thuong_da: text(body.ten_dot_ton_thuong_da, 255, true), ten_thuoc_dung_gan_thoi_diem_xuat_hien: text(body.ten_thuoc_dung_gan_thoi_diem_xuat_hien, 255), chi_tiet_dot_ton_thuong: text(body.chi_tiet_dot_ton_thuong) };
}
function location(body) {
  object(body, [...contextFields, 'vi_tri_co_the', 'ten_thuoc_lien_quan']);
  return { ...context(body), vi_tri_co_the: text(body.vi_tri_co_the, 255, true), ten_thuoc_lien_quan: text(body.ten_thuoc_lien_quan, 255) };
}
function photo(body, patch = false) {
  const writable = ['moc_tien_trien', 'diem_ngua_nrs', 'diem_dau_nrs', 'diem_bong_rat_nrs', 'so_luong_not_san'];
  object(body, patch ? writable : [...writable, 'ma_tep_dinh_kem', 'ma_vi_tri_ton_thuong', 'thoi_diem_chup']);
  const result = {};
  if (!patch) {
    result.ma_tep_dinh_kem = identifier(body.ma_tep_dinh_kem);
    result.ma_vi_tri_ton_thuong = body.ma_vi_tri_ton_thuong == null ? null : identifier(body.ma_vi_tri_ton_thuong);
    result.thoi_diem_chup = timestamp(body.thoi_diem_chup);
    if (!Object.hasOwn(body, 'moc_tien_trien')) throw invalid();
  }
  if (Object.hasOwn(body, 'moc_tien_trien')) {
    if (!['start', 'peak', 'normal'].includes(body.moc_tien_trien)) throw invalid();
    result.moc_tien_trien = body.moc_tien_trien;
  }
  for (const field of writable.slice(1)) if (Object.hasOwn(body, field)) {
    const value = body[field];
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > (field === 'so_luong_not_san' ? 2147483647 : 10))) throw invalid();
    result[field] = value;
  }
  if (patch && !Object.keys(result).length) throw invalid();
  return result;
}
module.exports = { episode, location, photo };
