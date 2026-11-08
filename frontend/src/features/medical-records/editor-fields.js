// Fixed CAP/MAN forms; field types match verified PostgreSQL writable columns.
export const editorFields = {
  "hosobenhan": {
    "ngay_bat_dau_dieu_tri_ngoai_tru": {
      "type": "date",
      "label": "Bắt đầu điều trị ngoại trú"
    },
    "ngay_ket_thuc_dieu_tri_ngoai_tru": {
      "type": "date",
      "label": "Kết thúc điều trị ngoại trú"
    },
    "chan_doan_tuyen_truoc": {
      "type": "text",
      "label": "Chẩn đoán tuyến trước"
    },
    "chan_doan_ban_dau_phong_kham": {
      "type": "text",
      "label": "Chẩn đoán ban đầu phòng khám"
    },
    "ket_qua_dieu_tri_bao_hiem": {
      "type": "text",
      "options": [
        "Khoi benh",
        "Do",
        "Khong do",
        "Nang hon",
        "Chet",
        "Bien chung"
      ],
      "label": "Kết quả điều trị bảo hiểm"
    },
    "thoi_gian_khoi_phat_tuan": {
      "type": "decimal",
      "precision": 12,
      "scale": 2,
      "label": "Thời gian khởi phát (tuần)",
      "minimum": "0"
    },
    "tien_su_gia_dinh": {
      "type": "text",
      "options": [
        "Co",
        "Khong",
        "Khong ro"
      ],
      "label": "Tiền sử gia đình"
    },
    "tien_su_gia_dinh_ghi_ro": {
      "type": "text",
      "label": "Chi tiết tiền sử gia đình"
    },
    "da_dieu_tri_truoc_kham": {
      "type": "boolean",
      "label": "Đã điều trị trước khám"
    }
  },
  "benhanmaydaycap": {
    "nhap_vien": {
      "type": "boolean",
      "label": "Nhập viện"
    },
    "cd_soc_phan_ve": {
      "type": "boolean",
      "label": "Chẩn đoán sốc phản vệ đã ghi nhận"
    },
    "cd_phan_ve": {
      "type": "boolean",
      "label": "Chẩn đoán phản vệ đã ghi nhận"
    },
    "cd_may_day_cap_nang": {
      "type": "boolean",
      "label": "Chẩn đoán mề đay cấp nặng đã ghi nhận"
    },
    "cd_may_day_cap_thong_thuong": {
      "type": "boolean",
      "label": "Chẩn đoán mề đay cấp thông thường đã ghi nhận"
    },
    "tien_su_benh_nen_da": {
      "type": "text",
      "label": "Tien su benh nen da"
    },
    "tien_su_benh_nen_ho_hap": {
      "type": "text",
      "label": "Tien su benh nen ho hap"
    },
    "tien_su_benh_nen_tuan_hoan": {
      "type": "text",
      "label": "Tien su benh nen tuan hoan"
    },
    "tien_su_benh_tim_mach_ghi_ro": {
      "type": "text",
      "label": "Tien su benh tim mach ghi ro"
    },
    "tien_su_benh_tieu_hoa_man_tinh_ghi_ro": {
      "type": "text",
      "label": "Tien su benh tieu hoa man tinh ghi ro"
    },
    "tien_su_benh_nen_tieu_hoa": {
      "type": "text",
      "label": "Tien su benh nen tieu hoa"
    },
    "nhom_yeu_to_nghi_ngo": {
      "type": "text",
      "label": "Nhom yeu to nghi ngo"
    },
    "co_nghi_ngo_dot_nay": {
      "type": "boolean",
      "label": "Co nghi ngo dot nay"
    },
    "ten_yeu_to_nghi_ngo": {
      "type": "text",
      "label": "Ten yeu to nghi ngo"
    },
    "loai_tien_su": {
      "type": "text",
      "label": "Loai tien su"
    },
    "da_tung_phan_ung_truoc_day": {
      "type": "boolean",
      "label": "Da tung phan ung truoc day"
    },
    "thoi_gian_tiep_xuc_den_khoi_phat": {
      "type": "interval",
      "label": "Thoi gian tiep xuc den khoi phat"
    },
    "thoi_gian_keo_dai_tb": {
      "type": "interval",
      "label": "Thoi gian keo dai tb"
    },
    "dot_gan_nhat_cach": {
      "type": "interval",
      "label": "Dot gan nhat cach"
    },
    "tien_su_phan_ve_ghi_ro": {
      "type": "text",
      "label": "Tien su phan ve ghi ro"
    },
    "tien_su_di_ung_ghi_ro": {
      "type": "text",
      "label": "Tien su di ung ghi ro"
    },
    "da_dieu_tri_benh_dot_nay": {
      "type": "boolean",
      "label": "Da dieu tri benh dot nay"
    },
    "tuoi_lan_dau_bi_benh": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "Tuoi lan dau bi benh"
    },
    "so_lan_may_day_cap_truoc": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So lan may day cap truoc"
    },
    "benh_phu": {
      "type": "text",
      "label": "Benh phu"
    }
  },
  "benhanmaydayman": {
    "chan_doan_chinh": {
      "type": "text",
      "options": [
        "CSU",
        "CIndU",
        "CSU + CIndU",
        "Phu mach don thuan"
      ],
      "label": "Chẩn đoán chính đã ghi nhận"
    },
    "phan_nhom_csu": {
      "type": "text",
      "options": [
        "CSU Type I",
        "CSU Type IIb",
        "Chong lap Type I + Type IIb",
        "Khong xac dinh"
      ],
      "label": "Phan nhom csu"
    },
    "chung_da_ve_noi": {
      "type": "boolean",
      "label": "Chung da ve noi"
    },
    "may_day_cholinergic": {
      "type": "boolean",
      "label": "May day cholinergic"
    },
    "may_day_do_lanh": {
      "type": "boolean",
      "label": "May day do lanh"
    },
    "may_day_adrenergic": {
      "type": "boolean",
      "label": "May day adrenergic"
    },
    "may_day_do_nuoc": {
      "type": "boolean",
      "label": "May day do nuoc"
    },
    "may_day_do_anh_sang": {
      "type": "boolean",
      "label": "May day do anh sang"
    },
    "may_day_cam_ung_khac": {
      "type": "boolean",
      "label": "May day cam ung khac"
    },
    "may_day_cam_ung_khac_ghi_ro": {
      "type": "text",
      "label": "May day cam ung khac ghi ro"
    },
    "bieu_hien_qua_trinh_benh": {
      "type": "text",
      "options": [
        "Chi san phu",
        "Chi phu mach",
        "San phu + phu mach"
      ],
      "label": "Bieu hien qua trinh benh"
    }
  },
  "phienkham": {
    "loai_phien_kham": {
      "type": "text",
      "label": "Loai phien kham"
    },
    "luu_huyet_thanh": {
      "type": "boolean",
      "label": "Lưu huyết thanh"
    },
    "sot": {
      "type": "boolean",
      "label": "Sốt"
    },
    "sot_nhiet_do_c": {
      "type": "decimal",
      "precision": 4,
      "scale": 1,
      "label": "Nhiệt độ khi sốt (°C)",
      "positive": true
    },
    "ngay_hen_tai_kham": {
      "type": "date",
      "label": "Ngày hẹn tái khám"
    },
    "tom_tat_buoi_kham": {
      "type": "text",
      "label": "Tóm tắt buổi khám"
    },
    "huong_xu_tri_lan_sau": {
      "type": "text",
      "label": "Hướng xử trí lần sau"
    },
    "dan_do": {
      "type": "text",
      "label": "Dặn dò"
    }
  },
  "phienkhamcap": {
    "trieu_chung_da": {
      "type": "text",
      "label": "Trieu chung da"
    },
    "trieu_chung_ho_hap": {
      "type": "text",
      "label": "Trieu chung ho hap"
    },
    "so_voi_thuong_ngay_ho_hap": {
      "type": "text",
      "label": "So voi thuong ngay ho hap"
    },
    "trieu_chung_tuan_hoan": {
      "type": "text",
      "label": "Trieu chung tuan hoan"
    },
    "so_voi_thuong_ngay_tuan_hoan": {
      "type": "text",
      "label": "So voi thuong ngay tuan hoan"
    },
    "trieu_chung_tieu_hoa": {
      "type": "text",
      "label": "Trieu chung tieu hoa"
    },
    "so_voi_thuong_ngay_tieu_hoa": {
      "type": "text",
      "label": "So voi thuong ngay tieu hoa"
    },
    "co_san_phu": {
      "type": "boolean",
      "label": "Co san phu"
    },
    "co_anh_san_phu": {
      "type": "boolean",
      "label": "Co anh san phu"
    },
    "so_lan_non": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So lan non"
    }
  },
  "phienkhamman": {
    "hien_tai_co_san_phu": {
      "type": "boolean",
      "label": "Hien tai co san phu"
    },
    "uu_the_ngau_nhien": {
      "type": "boolean",
      "label": "Uu the ngau nhien"
    },
    "vi_tri_san_phu": {
      "type": "text",
      "label": "Vi tri san phu"
    },
    "yeu_to_lam_nang_sa_phu": {
      "type": "text",
      "label": "Yeu to lam nang sa phu"
    },
    "hoan_canh_xuat_hien_san_phu": {
      "type": "text",
      "label": "Hoan canh xuat hien san phu"
    },
    "trong_dot_co_phu_mach": {
      "type": "boolean",
      "label": "Trong dot co phu mach"
    },
    "hien_tai_co_phu_mach": {
      "type": "boolean",
      "label": "Hien tai co phu mach"
    },
    "so_lan_phu_mach_dot_nay": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So lan phu mach dot nay"
    },
    "hoan_canh_xuat_hien_phu_mach": {
      "type": "text",
      "label": "Hoan canh xuat hien phu mach"
    },
    "so_lan_phu_mach_nang_phai_nhap_vien": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So lan phu mach nang phai nhap vien"
    },
    "thoi_gian_ton_tai_phu_mach_co_dung_thuoc": {
      "type": "text",
      "label": "Thoi gian ton tai phu mach co dung thuoc"
    },
    "thoi_gian_ton_tai_phu_mach_khong_dung_thuoc": {
      "type": "text",
      "label": "Thoi gian ton tai phu mach khong dung thuoc"
    },
    "ben_phu_mach": {
      "type": "text",
      "label": "Ben phu mach"
    },
    "thoi_gian_ngau_nhien_tuan": {
      "type": "decimal",
      "precision": 12,
      "scale": 2,
      "label": "Thoi gian ngau nhien tuan",
      "minimum": "0"
    },
    "uu_the_kich_thich": {
      "type": "boolean",
      "label": "Uu the kich thich"
    },
    "thoi_gian_kich_thich_tuan": {
      "type": "decimal",
      "precision": 12,
      "scale": 2,
      "label": "Thoi gian kich thich tuan",
      "minimum": "0"
    },
    "uu_the_tuong_duong": {
      "type": "boolean",
      "label": "Uu the tuong duong"
    },
    "uu_the_khong_ro": {
      "type": "boolean",
      "label": "Uu the khong ro"
    },
    "thu_tu_xuat_hien_so_voi_san_phu": {
      "type": "text",
      "label": "Thu tu xuat hien so voi san phu"
    },
    "phu_mach_1_tuan_gan_day": {
      "type": "boolean",
      "label": "Phu mach 1 tuan gan day"
    },
    "chan_doan_tai_kham": {
      "type": "text",
      "label": "Chan doan tai kham"
    },
    "khoang_cach_xuat_hien": {
      "type": "text",
      "label": "Khoang cach xuat hien"
    },
    "phu_mi_mat": {
      "type": "boolean",
      "label": "Phu mi mat"
    },
    "phu_luoi": {
      "type": "boolean",
      "label": "Phu luoi"
    },
    "phu_moi": {
      "type": "boolean",
      "label": "Phu moi"
    },
    "phu_vung_mat_khac": {
      "type": "boolean",
      "label": "Phu vung mat khac"
    },
    "phu_thanh_quan": {
      "type": "boolean",
      "label": "Phu thanh quan"
    },
    "phu_ban_chan": {
      "type": "boolean",
      "label": "Phu ban chan"
    },
    "phu_sinh_duc": {
      "type": "boolean",
      "label": "Phu sinh duc"
    },
    "phu_vi_tri_khac": {
      "type": "boolean",
      "label": "Phu vi tri khac"
    },
    "phu_vi_tri_khac_ghi_ro": {
      "type": "text",
      "label": "Phu vi tri khac ghi ro"
    },
    "phu_ban_tay": {
      "type": "boolean",
      "label": "Phu ban tay"
    }
  },
  "tiensubanthan": {
    "tien_su_co_dia": {
      "type": "boolean",
      "label": "Tien su co dia"
    },
    "tien_su_co_dia_ghi_ro": {
      "type": "text",
      "label": "Tien su co dia ghi ro"
    },
    "tien_su_tuyen_giap": {
      "type": "boolean",
      "label": "Tien su tuyen giap"
    },
    "tien_su_tuyen_giap_ghi_ro": {
      "type": "text",
      "label": "Tien su tuyen giap ghi ro"
    },
    "tien_su_tu_mien": {
      "type": "boolean",
      "label": "Tien su tu mien"
    },
    "tien_su_tu_mien_ghi_ro": {
      "type": "text",
      "label": "Tien su tu mien ghi ro"
    },
    "tien_su_di_ung": {
      "type": "boolean",
      "label": "Tien su di ung"
    },
    "tien_su_di_ung_ghi_ro": {
      "type": "text",
      "label": "Tien su di ung ghi ro"
    },
    "tien_su_phan_ve": {
      "type": "boolean",
      "label": "Tien su phan ve"
    },
    "tien_su_phan_ve_ghi_ro": {
      "type": "text",
      "label": "Tien su phan ve ghi ro"
    },
    "tien_su_viem_nhiem_man": {
      "type": "boolean",
      "label": "Tien su viem nhiem man"
    },
    "tien_su_viem_nhiem_man_ghi_ro": {
      "type": "text",
      "label": "Tien su viem nhiem man ghi ro"
    },
    "tien_su_benh_khac": {
      "type": "boolean",
      "label": "Tien su benh khac"
    },
    "tien_su_benh_khac_ghi_ro": {
      "type": "text",
      "label": "Tien su benh khac ghi ro"
    }
  },
  "benhsucacdotbenhtruoc": {
    "tung_co_dot_tuong_tu": {
      "type": "boolean",
      "label": "Tung co dot tuong tu"
    },
    "tuoi_khoi_phat": {
      "type": "integer",
      "min": 0,
      "max": 32767,
      "label": "Tuoi khoi phat"
    },
    "so_dot_truoc": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So dot truoc"
    },
    "kieu_dien_bien": {
      "type": "text",
      "label": "Kieu dien bien"
    },
    "bieu_hien_dot_truoc": {
      "type": "text",
      "label": "Bieu hien dot truoc"
    },
    "da_tung_nhap_vien": {
      "type": "boolean",
      "label": "Da tung nhap vien"
    },
    "so_lan_nhap_vien": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So lan nhap vien"
    },
    "thoi_gian_tu_dot_gan_nhat": {
      "type": "decimal",
      "label": "Thoi gian tu dot gan nhat",
      "minimum": "0"
    },
    "dien_bien_cac_dot_truoc": {
      "type": "text",
      "label": "Dien bien cac dot truoc"
    }
  },
  "hoancanhkhoiphatdiung": {
    "thuc_an_nghi_ngo": {
      "type": "text",
      "label": "Thuc an nghi ngo"
    },
    "thuc_an_thoi_gian": {
      "type": "decimal",
      "label": "Thuc an thoi gian",
      "minimum": "0"
    },
    "thuc_an_tung_bi": {
      "type": "boolean",
      "label": "Thuc an tung bi"
    },
    "thuc_an_loai_tien_su": {
      "type": "text",
      "label": "Thuc an loai tien su"
    },
    "thuc_an_tien_su_ghi_ro": {
      "type": "text",
      "label": "Thuc an tien su ghi ro"
    },
    "thuoc_nghi_ngo": {
      "type": "text",
      "label": "Thuoc nghi ngo"
    },
    "thuoc_thoi_gian": {
      "type": "decimal",
      "label": "Thuoc thoi gian",
      "minimum": "0"
    },
    "thuoc_tung_bi": {
      "type": "boolean",
      "label": "Thuoc tung bi"
    },
    "thuoc_loai_tien_su": {
      "type": "text",
      "label": "Thuoc loai tien su"
    },
    "thuoc_tien_su_ghi_ro": {
      "type": "text",
      "label": "Thuoc tien su ghi ro"
    },
    "con_trung_nghi_ngo": {
      "type": "text",
      "label": "Con trung nghi ngo"
    },
    "con_trung_thoi_gian": {
      "type": "decimal",
      "label": "Con trung thoi gian",
      "minimum": "0"
    },
    "con_trung_tung_bi": {
      "type": "boolean",
      "label": "Con trung tung bi"
    },
    "con_trung_loai_tien_su": {
      "type": "text",
      "label": "Con trung loai tien su"
    },
    "con_trung_tien_su_ghi_ro": {
      "type": "text",
      "label": "Con trung tien su ghi ro"
    },
    "khac_nghi_ngo": {
      "type": "text",
      "label": "Khac nghi ngo"
    },
    "khac_thoi_gian": {
      "type": "decimal",
      "label": "Khac thoi gian",
      "minimum": "0"
    },
    "khac_tung_bi": {
      "type": "boolean",
      "label": "Khac tung bi"
    },
    "khac_loai_tien_su": {
      "type": "text",
      "label": "Khac loai tien su"
    },
    "khac_tien_su_ghi_ro": {
      "type": "text",
      "label": "Khac tien su ghi ro"
    }
  },
  "tinhtrangnhiemtrung": {
    "ho_hap_ho": {
      "type": "boolean",
      "label": "Ho hap ho"
    },
    "ho_hap_dau_hong": {
      "type": "boolean",
      "label": "Ho hap dau hong"
    },
    "ho_hap_hat_hoi": {
      "type": "boolean",
      "label": "Ho hap hat hoi"
    },
    "ho_hap_so_mui": {
      "type": "boolean",
      "label": "Ho hap so mui"
    },
    "ho_hap_thoi_gian": {
      "type": "decimal",
      "label": "Ho hap thoi gian",
      "minimum": "0"
    },
    "ho_hap_khoang_cach": {
      "type": "decimal",
      "label": "Ho hap khoang cach",
      "minimum": "0"
    },
    "tiet_nieu_tieu_rat": {
      "type": "boolean",
      "label": "Tiet nieu tieu rat"
    },
    "tiet_nieu_tieu_buot": {
      "type": "boolean",
      "label": "Tiet nieu tieu buot"
    },
    "tiet_nieu_thoi_gian": {
      "type": "decimal",
      "label": "Tiet nieu thoi gian",
      "minimum": "0"
    },
    "tiet_nieu_khoang_cach": {
      "type": "decimal",
      "label": "Tiet nieu khoang cach",
      "minimum": "0"
    },
    "da_mun": {
      "type": "boolean",
      "label": "Da mun"
    },
    "da_nhot": {
      "type": "boolean",
      "label": "Da nhot"
    },
    "da_thoi_gian": {
      "type": "decimal",
      "label": "Da thoi gian",
      "minimum": "0"
    },
    "da_khoang_cach": {
      "type": "decimal",
      "label": "Da khoang cach",
      "minimum": "0"
    },
    "khac_ghi_ro": {
      "type": "text",
      "label": "Khac ghi ro"
    },
    "khac_thoi_gian": {
      "type": "decimal",
      "label": "Khac thoi gian",
      "minimum": "0"
    },
    "khac_khoang_cach": {
      "type": "decimal",
      "label": "Khac khoang cach",
      "minimum": "0"
    }
  },
  "dauhieusinhton": {
    "thoi_diem": {
      "type": "timestamp",
      "label": "Thoi diem"
    },
    "tri_giac": {
      "type": "text",
      "label": "Tri giac"
    },
    "nhiet_do": {
      "type": "decimal",
      "label": "Đơn vị: độ C."
    },
    "spo2": {
      "type": "decimal",
      "label": "Độ bão hòa oxy ngoại vi, đơn vị: %.",
      "minimum": "0",
      "maximum": "100"
    },
    "mach": {
      "type": "decimal",
      "label": "Đơn vị: lần/phút.",
      "minimum": "0"
    },
    "huyet_ap_tam_thu": {
      "type": "decimal",
      "label": "Đơn vị: mmHg.",
      "minimum": "0"
    },
    "huyet_ap_tam_truong": {
      "type": "decimal",
      "label": "Đơn vị: mmHg.",
      "minimum": "0"
    },
    "nhip_tho": {
      "type": "decimal",
      "label": "Đơn vị: lần/phút.",
      "minimum": "0"
    },
    "bat_thuong_co_quan_khac": {
      "type": "boolean",
      "label": "Bat thuong co quan khac"
    },
    "bat_thuong_co_quan_khac_ghi_ro": {
      "type": "text",
      "label": "Bat thuong co quan khac ghi ro"
    }
  },
  "chitiettonthuongcaptinh": {
    "dang_ton_thuong": {
      "type": "text",
      "label": "Dang ton thuong"
    },
    "dang_ton_thuong_khac": {
      "type": "text",
      "label": "Dang ton thuong khac"
    },
    "kich_thuoc_max_mm": {
      "type": "decimal",
      "label": "Đơn vị: mm.",
      "minimum": "0"
    },
    "kich_thuoc_min_mm": {
      "type": "decimal",
      "label": "Đơn vị: mm.",
      "minimum": "0"
    },
    "kich_thuoc_dong_deu_mm": {
      "type": "decimal",
      "label": "Đơn vị: mm.",
      "minimum": "0"
    },
    "loai_kich_thuoc": {
      "type": "text",
      "label": "Loai kich thuoc"
    },
    "thoi_gian_ton_tai_tb": {
      "type": "decimal",
      "label": "Thoi gian ton tai tb",
      "minimum": "0"
    },
    "dien_bien": {
      "type": "text",
      "label": "Dien bien"
    },
    "so_luong_san_phu": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So luong san phu"
    },
    "phu_mach_ben": {
      "type": "boolean",
      "label": "Phu mach ben"
    },
    "vi_tri": {
      "type": "text",
      "label": "Vi tri"
    },
    "vi_tri_dac_biet_ghi_ro": {
      "type": "text",
      "label": "Vi tri dac biet ghi ro"
    }
  },
  "chitiettonthuongsanphu": {
    "dang_ton_thuong": {
      "type": "text",
      "label": "Dang ton thuong"
    },
    "kich_thuoc": {
      "type": "decimal",
      "label": "Kich thuoc",
      "minimum": "0"
    },
    "thoi_gian_ton_tai": {
      "type": "decimal",
      "label": "Thoi gian ton tai",
      "minimum": "0"
    },
    "thoi_diem": {
      "type": "timestamp",
      "label": "Thoi diem"
    },
    "tinh_trang_dung_thuoc": {
      "type": "text",
      "label": "Tinh trang dung thuoc"
    },
    "so_luong": {
      "type": "integer",
      "min": 0,
      "max": 2147483647,
      "label": "So luong"
    },
    "vi_tri": {
      "type": "text",
      "label": "Vi tri"
    }
  },
  "ketquacanlamsang": {
    "wbc": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "WBC (G/L)",
      "minimum": "0"
    },
    "crp": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "CRP (mg/L)",
      "minimum": "0"
    },
    "ige_toan_phan": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "IgE toàn phần (IU/mL)",
      "minimum": "0"
    },
    "can_lam_sang_khac_ghi_chu": {
      "type": "text",
      "label": "Ghi chú cận lâm sàng khác"
    },
    "xet_nghiem_khac": {
      "type": "text",
      "label": "Xét nghiệm khác"
    },
    "thoi_diem_thuc_hien": {
      "type": "timestamp",
      "label": "Thời điểm thực hiện"
    }
  },
  "ketquacanlamsangcap": {
    "lym": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "LYM (G/L)",
      "minimum": "0"
    },
    "neu": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "NEU (G/L)",
      "minimum": "0"
    },
    "plt": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "PLT (G/L)",
      "minimum": "0"
    },
    "tryptase_cap": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Tryptase cấp (ng/mL)",
      "minimum": "0"
    },
    "tryptase_nen": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Tryptase nền (ng/mL)",
      "minimum": "0"
    }
  },
  "ketquacanlamsangman": {
    "test_huyet_thanh_tu_than": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ],
      "label": "Test huyet thanh tu than"
    },
    "ige_khang_tpo_ket_qua": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ],
      "label": "Ige khang tpo ket qua"
    },
    "bat_ket_qua": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ],
      "label": "Bat ket qua"
    },
    "ige_khang_il24_ket_qua": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ],
      "label": "Ige khang il24 ket qua"
    },
    "asst_duong_kinh_mm": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: mm",
      "minimum": "0"
    },
    "eo": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: G/L",
      "minimum": "0"
    },
    "ba_bach_cau": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: G/L",
      "minimum": "0"
    },
    "anti_tpo": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: IU/mL",
      "minimum": "0"
    },
    "tsh": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: micro-IU/mL",
      "minimum": "0"
    },
    "ft4": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: pmol/L",
      "minimum": "0"
    },
    "ft3": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: pmol/L",
      "minimum": "0"
    },
    "mau_lang_2h": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: mm",
      "minimum": "0"
    },
    "mau_lang_1h": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "label": "Đơn vị: mm",
      "minimum": "0"
    },
    "ana_hep2": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh"
      ],
      "label": "Ana hep2"
    },
    "sieu_am_tuyen_giap": {
      "type": "text",
      "label": "Sieu am tuyen giap"
    }
  },
  "nguoi": {
    "ho_ten": {
      "type": "text",
      "maxLength": 150,
      "label": "Họ tên"
    },
    "so_dien_thoai": {
      "type": "text",
      "maxLength": 10,
      "label": "Số điện thoại"
    },
    "ngay_sinh": {
      "type": "date",
      "label": "Ngày sinh"
    },
    "gioi_tinh": {
      "type": "text",
      "options": [
        "Nam",
        "Nu"
      ],
      "label": "Giới tính"
    },
    "dia_chi_tinh_tp": {
      "type": "text",
      "maxLength": 100,
      "label": "Tỉnh/thành phố"
    },
    "dia_chi_xa_phuong": {
      "type": "text",
      "maxLength": 100,
      "label": "Xã/phường"
    },
    "dia_chi_so_nha_thon_pho": {
      "type": "text",
      "maxLength": 255,
      "label": "Số nhà/thôn/phố"
    }
  },
  "benhnhan": {
    "ma_his": {
      "type": "text",
      "maxLength": 50,
      "label": "Mã HIS"
    },
    "nghe_nghiep": {
      "type": "text",
      "maxLength": 40,
      "options": [
        "Cong nhan",
        "Nong dan",
        "Hoc sinh - Sinh vien",
        "Can bo cong chuc",
        "Khac"
      ],
      "label": "Nghề nghiệp"
    },
    "dan_toc": {
      "type": "text",
      "maxLength": 50,
      "label": "Dân tộc"
    },
    "bhyt_so_the": {
      "type": "text",
      "maxLength": 30,
      "label": "Số thẻ bảo hiểm y tế"
    },
    "bhyt_gia_tri_den": {
      "type": "date",
      "label": "Bảo hiểm có giá trị đến"
    },
    "nguoi_nha_ho_ten_dia_chi": {
      "type": "text",
      "label": "Họ tên/địa chỉ người nhà"
    },
    "nguoi_nha_so_dien_thoai": {
      "type": "text",
      "maxLength": 10,
      "label": "Điện thoại người nhà"
    }
  }
}
