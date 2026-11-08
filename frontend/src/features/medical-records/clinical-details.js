// Explicit display contracts from doc/mayday.sql. No thresholds, rounding or
// derived medical interpretation: numeric strings retain server precision.
export const prescriptionFields = [
  ['ma_don_thuoc', 'Mã đơn thuốc'], ['ma_phien_kham', 'Mã phiên khám'],
  ['ngay_ke_don', 'Ngày kê đơn'], ['trang_thai_don', 'Trạng thái đơn'],
  ['ghi_chu_dieu_tri', 'Ghi chú điều trị đã ghi nhận'],
  ['ngung_thuoc_lan_sau', 'Có chỉ dẫn ngừng thuốc lần sau'],
  ['thuoc_can_ngung_truoc_tai_kham', 'Thuốc cần ngừng trước tái khám đã ghi nhận'],
]

export const medicationColumns = [
  ['ten_thuoc', 'Tên thuốc'],
  ['ma_thuoc', 'Mã thuốc danh mục'], ['ten_thuoc_bo_sung', 'Tên thuốc bổ sung'],
  ['lieu_dung', 'Liều dùng đã kê'], ['thoi_gian_dung', 'Thời gian dùng đã kê'],
  ['ma_ke_hoach_dieu_tri', 'Mã kế hoạch điều trị ngoài'],
]

const commonLabFields = [
  ['ma_ket_qua_can_lam_sang', 'Mã kết quả'], ['ma_phien_kham', 'Mã phiên khám'],
  ['loai_ket_qua_can_lam_sang', 'Loại kết quả'], ['thoi_diem_thuc_hien', 'Thời điểm thực hiện'],
  ['wbc', 'WBC (G/L)'], ['crp', 'CRP (mg/L)'], ['ige_toan_phan', 'IgE toàn phần (IU/mL)'],
  ['can_lam_sang_khac_ghi_chu', 'Ghi chú cận lâm sàng khác'], ['xet_nghiem_khac', 'Xét nghiệm khác'],
]
const acuteLabFields = [
  ['chi_tiet.lym', 'LYM (G/L)'], ['chi_tiet.neu', 'NEU (G/L)'], ['chi_tiet.plt', 'PLT (G/L)'],
  ['chi_tiet.tryptase_cap', 'Tryptase cấp (ng/mL)'], ['chi_tiet.tryptase_nen', 'Tryptase nền (ng/mL)'],
  ['chi_tiet.nlr', 'NLR đã lưu'], ['chi_tiet.plr', 'PLR đã lưu'],
]
const chronicLabFields = [
  ['chi_tiet.test_huyet_thanh_tu_than', 'Test huyết thanh tự thân'], ['chi_tiet.asst_duong_kinh_mm', 'Đường kính ASST (mm)'],
  ['chi_tiet.ige_khang_tpo_ket_qua', 'IgE kháng TPO (định tính)'], ['chi_tiet.anti_tpo', 'Anti-TPO (IU/mL, định lượng)'],
  ['chi_tiet.bat_ket_qua', 'BAT'], ['chi_tiet.ige_khang_il24_ket_qua', 'IgE kháng IL-24'],
  ['chi_tiet.eo', 'EO (G/L)'], ['chi_tiet.ba_bach_cau', 'BA bạch cầu (G/L)'],
  ['chi_tiet.tsh', 'TSH (micro-IU/mL)'], ['chi_tiet.ft4', 'FT4 (pmol/L)'], ['chi_tiet.ft3', 'FT3 (pmol/L)'],
  ['chi_tiet.mau_lang_1h', 'Máu lắng 1 giờ (mm)'], ['chi_tiet.mau_lang_2h', 'Máu lắng 2 giờ (mm)'],
  ['chi_tiet.ana_hep2', 'ANA HEp-2'], ['chi_tiet.sieu_am_tuyen_giap', 'Siêu âm tuyến giáp'],
]

export function labFields(type) {
  const subtype = type === 'CAP' ? acuteLabFields : type === 'MAN' ? chronicLabFields : []
  return [...commonLabFields, ...subtype]
}
