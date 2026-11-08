// Display only verified stored fields. These labels do not define clinical rules.
export const visitFields = [
  ['ma_phien_kham', 'Mã phiên khám'], ['loai_benh_an', 'Loại bệnh án'], ['ngay_kham', 'Ngày khám'],
  ['lan_kham_thu', 'Lần khám'], ['ma_bac_si', 'Mã bác sĩ'], ['ma_phong_kham', 'Mã phòng khám'],
  ['loai_phien_kham', 'Loại phiên khám'], ['luu_huyet_thanh', 'Lưu huyết thanh'], ['sot', 'Sốt'],
  ['sot_nhiet_do_c', 'Nhiệt độ khi sốt (°C)'], ['ngay_hen_tai_kham', 'Ngày hẹn tái khám'],
  ['tom_tat_buoi_kham', 'Tóm tắt buổi khám'], ['huong_xu_tri_lan_sau', 'Hướng xử trí lần sau'], ['dan_do', 'Dặn dò'],
]
export const acuteVisitFields = [
  ['trieu_chung_da', 'Triệu chứng da'], ['trieu_chung_ho_hap', 'Triệu chứng hô hấp'],
  ['so_voi_thuong_ngay_ho_hap', 'Hô hấp so với thường ngày'], ['trieu_chung_tuan_hoan', 'Triệu chứng tuần hoàn'],
  ['so_voi_thuong_ngay_tuan_hoan', 'Tuần hoàn so với thường ngày'], ['trieu_chung_tieu_hoa', 'Triệu chứng tiêu hóa'],
  ['so_voi_thuong_ngay_tieu_hoa', 'Tiêu hóa so với thường ngày'], ['co_san_phu', 'Có sẩn phù'],
  ['co_anh_san_phu', 'Có ảnh sẩn phù'], ['so_lan_non', 'Số lần nôn'],
]
export const chronicVisitFields = [
  ['hien_tai_co_san_phu', 'Hiện tại có sẩn phù'], ['vi_tri_san_phu', 'Vị trí sẩn phù'],
  ['yeu_to_lam_nang_sa_phu', 'Yếu tố làm nặng sẩn phù'], ['hoan_canh_xuat_hien_san_phu', 'Hoàn cảnh xuất hiện sẩn phù'],
  ['uu_the_ngau_nhien', 'Ưu thế ngẫu nhiên'], ['thoi_gian_ngau_nhien_tuan', 'Thời gian ngẫu nhiên (tuần)'],
  ['uu_the_kich_thich', 'Ưu thế kích thích'], ['thoi_gian_kich_thich_tuan', 'Thời gian kích thích (tuần)'],
  ['uu_the_tuong_duong', 'Ưu thế tương đương'], ['uu_the_khong_ro', 'Chưa rõ ưu thế'],
  ['trong_dot_co_phu_mach', 'Trong đợt có phù mạch'], ['hien_tai_co_phu_mach', 'Hiện tại có phù mạch'],
  ['so_lan_phu_mach_dot_nay', 'Số lần phù mạch đợt này'], ['hoan_canh_xuat_hien_phu_mach', 'Hoàn cảnh xuất hiện phù mạch'],
  ['so_lan_phu_mach_nang_phai_nhap_vien', 'Số lần phù mạch nặng phải nhập viện'],
  ['thoi_gian_ton_tai_phu_mach_co_dung_thuoc', 'Thời gian phù mạch khi có dùng thuốc'],
  ['thoi_gian_ton_tai_phu_mach_khong_dung_thuoc', 'Thời gian phù mạch khi không dùng thuốc'],
  ['ben_phu_mach', 'Bên phù mạch'], ['thu_tu_xuat_hien_so_voi_san_phu', 'Thứ tự xuất hiện so với sẩn phù'],
  ['phu_mach_1_tuan_gan_day', 'Phù mạch trong tuần gần đây'], ['chan_doan_tai_kham', 'Chẩn đoán tái khám đã ghi nhận'],
  ['khoang_cach_xuat_hien', 'Khoảng cách xuất hiện'],
  ...[['mi_mat', 'mi mắt'], ['luoi', 'lưỡi'], ['moi', 'môi'], ['vung_mat_khac', 'vùng mặt khác'],
    ['thanh_quan', 'thanh quản'], ['ban_chan', 'bàn chân'], ['sinh_duc', 'sinh dục'], ['ban_tay', 'bàn tay'],
    ['vi_tri_khac', 'vị trí khác']].map(([field, label]) => [`phu_${field}`, `Phù ${label}`]),
  ['phu_vi_tri_khac_ghi_ro', 'Vị trí phù khác đã ghi nhận'],
]
const personalHistory = [
  ['co_dia', 'cơ địa'], ['tuyen_giap', 'tuyến giáp'], ['tu_mien', 'tự miễn'], ['di_ung', 'dị ứng'],
  ['phan_ve', 'phản vệ'], ['viem_nhiem_man', 'viêm nhiễm mạn'], ['benh_khac', 'bệnh khác'],
].flatMap(([field, label]) => [[`tien_su_${field}`, `Tiền sử ${label}`], [`tien_su_${field}_ghi_ro`, `Chi tiết tiền sử ${label}`]])
export const recordSections = [
  { path: 'personal-history', title: 'Tiền sử bản thân', id: 'ma_tien_su_ban_than', type: 'MAN', fields: personalHistory },
  { path: 'previous-episodes', title: 'Bệnh sử các đợt trước', id: 'ma_tien_su', type: 'MAN', fields: [
    ['tung_co_dot_tuong_tu', 'Từng có đợt tương tự'], ['tuoi_khoi_phat', 'Tuổi khởi phát'], ['so_dot_truoc', 'Số đợt trước'],
    ['kieu_dien_bien', 'Kiểu diễn biến'], ['bieu_hien_dot_truoc', 'Biểu hiện đợt trước'], ['da_tung_nhap_vien', 'Đã từng nhập viện'],
    ['so_lan_nhap_vien', 'Số lần nhập viện'], ['thoi_gian_tu_dot_gan_nhat', 'Thời gian từ đợt gần nhất đã lưu'], ['dien_bien_cac_dot_truoc', 'Diễn biến các đợt trước'],
  ] },
  { path: 'allergy-context', title: 'Hoàn cảnh khởi phát dị ứng', id: 'ma_hoan_canh_khoi_phat', fields: [
    ['thuc_an', 'thức ăn'], ['thuoc', 'thuốc'], ['con_trung', 'côn trùng'], ['khac', 'khác'],
  ].flatMap(([field, label]) => [[`${field}_nghi_ngo`, `Yếu tố nghi ngờ: ${label}`], [`${field}_thoi_gian`, `Thời gian ${label} đã lưu`],
    [`${field}_tung_bi`, `Từng gặp với ${label}`], [`${field}_loai_tien_su`, `Loại tiền sử ${label}`], [`${field}_tien_su_ghi_ro`, `Chi tiết tiền sử ${label}`]]) },
  { path: 'infections', title: 'Tình trạng nhiễm trùng', id: 'ma_tinh_trang_nhiem_trung', type: 'CAP', fields: [
    ['ho_hap_ho', 'Ho'], ['ho_hap_dau_hong', 'Đau họng'], ['ho_hap_hat_hoi', 'Hắt hơi'], ['ho_hap_so_mui', 'Sổ mũi'],
    ['tiet_nieu_tieu_rat', 'Tiểu rát'], ['tiet_nieu_tieu_buot', 'Tiểu buốt'], ['da_mun', 'Mụn'], ['da_nhot', 'Nhọt'],
    ['khac_ghi_ro', 'Biểu hiện khác'], ...[['ho_hap', 'Hô hấp'], ['tiet_nieu', 'Tiết niệu'], ['da', 'Da'], ['khac', 'Khác']].flatMap(([f, l]) =>
      [[`${f}_thoi_gian`, `${l}: thời gian đã lưu`], [`${f}_khoang_cach`, `${l}: khoảng cách đã lưu`]]),
  ] },
  { path: 'vitals', title: 'Dấu hiệu sinh tồn', id: 'ma_dau_hieu_sinh_ton', fields: [
    ['ma_phien_kham', 'Mã phiên khám'], ['thoi_diem', 'Thời điểm'], ['tri_giac', 'Tri giác'], ['nhiet_do', 'Nhiệt độ đã lưu'],
    ['spo2', 'SpO₂ (%)'], ['mach', 'Mạch đã lưu'], ['huyet_ap_tam_thu', 'Huyết áp tâm thu đã lưu'],
    ['huyet_ap_tam_truong', 'Huyết áp tâm trương đã lưu'], ['nhip_tho', 'Nhịp thở đã lưu'],
    ['bat_thuong_co_quan_khac', 'Bất thường cơ quan khác'], ['bat_thuong_co_quan_khac_ghi_ro', 'Chi tiết bất thường'],
  ] },
  { path: 'acute-lesions', title: 'Tổn thương cấp tính trong phiên khám', id: 'ma_chi_tiet_ton_thuong_cap_tinh', type: 'CAP', fields: [
    ['ma_phien_kham', 'Mã phiên khám'], ['dang_ton_thuong', 'Dạng tổn thương'], ['dang_ton_thuong_khac', 'Dạng tổn thương khác'],
    ['loai_kich_thuoc', 'Loại kích thước'], ['kich_thuoc_min_mm', 'Kích thước nhỏ nhất (mm)'], ['kich_thuoc_max_mm', 'Kích thước lớn nhất (mm)'],
    ['kich_thuoc_dong_deu_mm', 'Kích thước đồng đều (mm)'], ['thoi_gian_ton_tai_tb', 'Thời gian tồn tại trung bình đã lưu'],
    ['dien_bien', 'Diễn biến'], ['so_luong_san_phu', 'Số lượng sẩn phù'], ['phu_mach_ben', 'Phù mạch bên'], ['vi_tri', 'Vị trí'], ['vi_tri_dac_biet_ghi_ro', 'Vị trí đặc biệt'],
  ] },
  { path: 'chronic-lesions', title: 'Tổn thương sẩn phù trong phiên khám', id: 'ma_chi_tiet_ton_thuong', type: 'MAN', fields: [
    ['ma_phien_kham', 'Mã phiên khám'], ['dang_ton_thuong', 'Dạng tổn thương'], ['kich_thuoc', 'Kích thước đã lưu'],
    ['thoi_gian_ton_tai', 'Thời gian tồn tại đã lưu'], ['thoi_diem', 'Thời điểm'], ['tinh_trang_dung_thuoc', 'Tình trạng dùng thuốc'],
    ['ma_dac_diem_san_phu', 'Mã đặc điểm sẩn phù'], ['so_luong', 'Số lượng'], ['vi_tri', 'Vị trí'],
  ] },
]
