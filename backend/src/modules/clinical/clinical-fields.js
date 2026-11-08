// Fixed writable allowlists inspected against doc/mayday.sql. Not a runtime schema or form engine.
module.exports = {
  "hosobenhan": {
    "ngay_bat_dau_dieu_tri_ngoai_tru": {
      "type": "date"
    },
    "ngay_ket_thuc_dieu_tri_ngoai_tru": {
      "type": "date"
    },
    "chan_doan_tuyen_truoc": {
      "type": "text"
    },
    "chan_doan_ban_dau_phong_kham": {
      "type": "text"
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
      ]
    },
    "thoi_gian_khoi_phat_tuan": {
      "type": "decimal",
      "precision": 12,
      "scale": 2,
      "minimum": "0"
    },
    "tien_su_gia_dinh": {
      "type": "text",
      "options": [
        "Co",
        "Khong",
        "Khong ro"
      ]
    },
    "tien_su_gia_dinh_ghi_ro": {
      "type": "text"
    },
    "da_dieu_tri_truoc_kham": {
      "type": "boolean"
    }
  },
  "benhanmaydaycap": {
    "nhap_vien": {
      "type": "boolean"
    },
    "cd_soc_phan_ve": {
      "type": "boolean"
    },
    "cd_phan_ve": {
      "type": "boolean"
    },
    "cd_may_day_cap_nang": {
      "type": "boolean"
    },
    "cd_may_day_cap_thong_thuong": {
      "type": "boolean"
    },
    "tien_su_benh_nen_da": {
      "type": "text"
    },
    "tien_su_benh_nen_ho_hap": {
      "type": "text"
    },
    "tien_su_benh_nen_tuan_hoan": {
      "type": "text"
    },
    "tien_su_benh_tim_mach_ghi_ro": {
      "type": "text"
    },
    "tien_su_benh_tieu_hoa_man_tinh_ghi_ro": {
      "type": "text"
    },
    "tien_su_benh_nen_tieu_hoa": {
      "type": "text"
    },
    "nhom_yeu_to_nghi_ngo": {
      "type": "text"
    },
    "co_nghi_ngo_dot_nay": {
      "type": "boolean"
    },
    "ten_yeu_to_nghi_ngo": {
      "type": "text"
    },
    "loai_tien_su": {
      "type": "text"
    },
    "da_tung_phan_ung_truoc_day": {
      "type": "boolean"
    },
    "thoi_gian_tiep_xuc_den_khoi_phat": {
      "type": "interval"
    },
    "thoi_gian_keo_dai_tb": {
      "type": "interval"
    },
    "dot_gan_nhat_cach": {
      "type": "interval"
    },
    "tien_su_phan_ve_ghi_ro": {
      "type": "text"
    },
    "tien_su_di_ung_ghi_ro": {
      "type": "text"
    },
    "da_dieu_tri_benh_dot_nay": {
      "type": "boolean"
    },
    "tuoi_lan_dau_bi_benh": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "so_lan_may_day_cap_truoc": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "benh_phu": {
      "type": "text"
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
      ]
    },
    "phan_nhom_csu": {
      "type": "text",
      "options": [
        "CSU Type I",
        "CSU Type IIb",
        "Chong lap Type I + Type IIb",
        "Khong xac dinh"
      ]
    },
    "chung_da_ve_noi": {
      "type": "boolean"
    },
    "may_day_cholinergic": {
      "type": "boolean"
    },
    "may_day_do_lanh": {
      "type": "boolean"
    },
    "may_day_adrenergic": {
      "type": "boolean"
    },
    "may_day_do_nuoc": {
      "type": "boolean"
    },
    "may_day_do_anh_sang": {
      "type": "boolean"
    },
    "may_day_cam_ung_khac": {
      "type": "boolean"
    },
    "may_day_cam_ung_khac_ghi_ro": {
      "type": "text"
    },
    "bieu_hien_qua_trinh_benh": {
      "type": "text",
      "options": [
        "Chi san phu",
        "Chi phu mach",
        "San phu + phu mach"
      ]
    }
  },
  "phienkham": {
    "loai_phien_kham": {
      "type": "text"
    },
    "luu_huyet_thanh": {
      "type": "boolean"
    },
    "sot": {
      "type": "boolean"
    },
    "sot_nhiet_do_c": {
      "type": "decimal",
      "precision": 4,
      "scale": 1,
      "positive": true
    },
    "ngay_hen_tai_kham": {
      "type": "date"
    },
    "tom_tat_buoi_kham": {
      "type": "text"
    },
    "huong_xu_tri_lan_sau": {
      "type": "text"
    },
    "dan_do": {
      "type": "text"
    }
  },
  "phienkhamcap": {
    "trieu_chung_da": {
      "type": "text"
    },
    "trieu_chung_ho_hap": {
      "type": "text"
    },
    "so_voi_thuong_ngay_ho_hap": {
      "type": "text"
    },
    "trieu_chung_tuan_hoan": {
      "type": "text"
    },
    "so_voi_thuong_ngay_tuan_hoan": {
      "type": "text"
    },
    "trieu_chung_tieu_hoa": {
      "type": "text"
    },
    "so_voi_thuong_ngay_tieu_hoa": {
      "type": "text"
    },
    "co_san_phu": {
      "type": "boolean"
    },
    "co_anh_san_phu": {
      "type": "boolean"
    },
    "so_lan_non": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    }
  },
  "phienkhamman": {
    "hien_tai_co_san_phu": {
      "type": "boolean"
    },
    "uu_the_ngau_nhien": {
      "type": "boolean"
    },
    "vi_tri_san_phu": {
      "type": "text"
    },
    "yeu_to_lam_nang_sa_phu": {
      "type": "text"
    },
    "hoan_canh_xuat_hien_san_phu": {
      "type": "text"
    },
    "trong_dot_co_phu_mach": {
      "type": "boolean"
    },
    "hien_tai_co_phu_mach": {
      "type": "boolean"
    },
    "so_lan_phu_mach_dot_nay": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "hoan_canh_xuat_hien_phu_mach": {
      "type": "text"
    },
    "so_lan_phu_mach_nang_phai_nhap_vien": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "thoi_gian_ton_tai_phu_mach_co_dung_thuoc": {
      "type": "text"
    },
    "thoi_gian_ton_tai_phu_mach_khong_dung_thuoc": {
      "type": "text"
    },
    "ben_phu_mach": {
      "type": "text"
    },
    "thoi_gian_ngau_nhien_tuan": {
      "type": "decimal",
      "precision": 12,
      "scale": 2,
      "minimum": "0"
    },
    "uu_the_kich_thich": {
      "type": "boolean"
    },
    "thoi_gian_kich_thich_tuan": {
      "type": "decimal",
      "precision": 12,
      "scale": 2,
      "minimum": "0"
    },
    "uu_the_tuong_duong": {
      "type": "boolean"
    },
    "uu_the_khong_ro": {
      "type": "boolean"
    },
    "thu_tu_xuat_hien_so_voi_san_phu": {
      "type": "text"
    },
    "phu_mach_1_tuan_gan_day": {
      "type": "boolean"
    },
    "chan_doan_tai_kham": {
      "type": "text"
    },
    "khoang_cach_xuat_hien": {
      "type": "text"
    },
    "phu_mi_mat": {
      "type": "boolean"
    },
    "phu_luoi": {
      "type": "boolean"
    },
    "phu_moi": {
      "type": "boolean"
    },
    "phu_vung_mat_khac": {
      "type": "boolean"
    },
    "phu_thanh_quan": {
      "type": "boolean"
    },
    "phu_ban_chan": {
      "type": "boolean"
    },
    "phu_sinh_duc": {
      "type": "boolean"
    },
    "phu_vi_tri_khac": {
      "type": "boolean"
    },
    "phu_vi_tri_khac_ghi_ro": {
      "type": "text"
    },
    "phu_ban_tay": {
      "type": "boolean"
    }
  },
  "tiensubanthan": {
    "tien_su_co_dia": {
      "type": "boolean"
    },
    "tien_su_co_dia_ghi_ro": {
      "type": "text"
    },
    "tien_su_tuyen_giap": {
      "type": "boolean"
    },
    "tien_su_tuyen_giap_ghi_ro": {
      "type": "text"
    },
    "tien_su_tu_mien": {
      "type": "boolean"
    },
    "tien_su_tu_mien_ghi_ro": {
      "type": "text"
    },
    "tien_su_di_ung": {
      "type": "boolean"
    },
    "tien_su_di_ung_ghi_ro": {
      "type": "text"
    },
    "tien_su_phan_ve": {
      "type": "boolean"
    },
    "tien_su_phan_ve_ghi_ro": {
      "type": "text"
    },
    "tien_su_viem_nhiem_man": {
      "type": "boolean"
    },
    "tien_su_viem_nhiem_man_ghi_ro": {
      "type": "text"
    },
    "tien_su_benh_khac": {
      "type": "boolean"
    },
    "tien_su_benh_khac_ghi_ro": {
      "type": "text"
    }
  },
  "benhsucacdotbenhtruoc": {
    "tung_co_dot_tuong_tu": {
      "type": "boolean"
    },
    "tuoi_khoi_phat": {
      "type": "integer",
      "min": 0,
      "max": 32767
    },
    "so_dot_truoc": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "kieu_dien_bien": {
      "type": "text"
    },
    "bieu_hien_dot_truoc": {
      "type": "text"
    },
    "da_tung_nhap_vien": {
      "type": "boolean"
    },
    "so_lan_nhap_vien": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "thoi_gian_tu_dot_gan_nhat": {
      "type": "decimal",
      "minimum": "0"
    },
    "dien_bien_cac_dot_truoc": {
      "type": "text"
    }
  },
  "hoancanhkhoiphatdiung": {
    "thuc_an_nghi_ngo": {
      "type": "text"
    },
    "thuc_an_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "thuc_an_tung_bi": {
      "type": "boolean"
    },
    "thuc_an_loai_tien_su": {
      "type": "text"
    },
    "thuc_an_tien_su_ghi_ro": {
      "type": "text"
    },
    "thuoc_nghi_ngo": {
      "type": "text"
    },
    "thuoc_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "thuoc_tung_bi": {
      "type": "boolean"
    },
    "thuoc_loai_tien_su": {
      "type": "text"
    },
    "thuoc_tien_su_ghi_ro": {
      "type": "text"
    },
    "con_trung_nghi_ngo": {
      "type": "text"
    },
    "con_trung_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "con_trung_tung_bi": {
      "type": "boolean"
    },
    "con_trung_loai_tien_su": {
      "type": "text"
    },
    "con_trung_tien_su_ghi_ro": {
      "type": "text"
    },
    "khac_nghi_ngo": {
      "type": "text"
    },
    "khac_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "khac_tung_bi": {
      "type": "boolean"
    },
    "khac_loai_tien_su": {
      "type": "text"
    },
    "khac_tien_su_ghi_ro": {
      "type": "text"
    }
  },
  "tinhtrangnhiemtrung": {
    "ho_hap_ho": {
      "type": "boolean"
    },
    "ho_hap_dau_hong": {
      "type": "boolean"
    },
    "ho_hap_hat_hoi": {
      "type": "boolean"
    },
    "ho_hap_so_mui": {
      "type": "boolean"
    },
    "ho_hap_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "ho_hap_khoang_cach": {
      "type": "decimal",
      "minimum": "0"
    },
    "tiet_nieu_tieu_rat": {
      "type": "boolean"
    },
    "tiet_nieu_tieu_buot": {
      "type": "boolean"
    },
    "tiet_nieu_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "tiet_nieu_khoang_cach": {
      "type": "decimal",
      "minimum": "0"
    },
    "da_mun": {
      "type": "boolean"
    },
    "da_nhot": {
      "type": "boolean"
    },
    "da_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "da_khoang_cach": {
      "type": "decimal",
      "minimum": "0"
    },
    "khac_ghi_ro": {
      "type": "text"
    },
    "khac_thoi_gian": {
      "type": "decimal",
      "minimum": "0"
    },
    "khac_khoang_cach": {
      "type": "decimal",
      "minimum": "0"
    }
  },
  "dauhieusinhton": {
    "thoi_diem": {
      "type": "timestamp"
    },
    "tri_giac": {
      "type": "text"
    },
    "nhiet_do": {
      "type": "decimal"
    },
    "spo2": {
      "type": "decimal",
      "minimum": "0",
      "maximum": "100"
    },
    "mach": {
      "type": "decimal",
      "minimum": "0"
    },
    "huyet_ap_tam_thu": {
      "type": "decimal",
      "minimum": "0"
    },
    "huyet_ap_tam_truong": {
      "type": "decimal",
      "minimum": "0"
    },
    "nhip_tho": {
      "type": "decimal",
      "minimum": "0"
    },
    "bat_thuong_co_quan_khac": {
      "type": "boolean"
    },
    "bat_thuong_co_quan_khac_ghi_ro": {
      "type": "text"
    }
  },
  "chitiettonthuongcaptinh": {
    "dang_ton_thuong": {
      "type": "text"
    },
    "dang_ton_thuong_khac": {
      "type": "text"
    },
    "kich_thuoc_max_mm": {
      "type": "decimal",
      "minimum": "0"
    },
    "kich_thuoc_min_mm": {
      "type": "decimal",
      "minimum": "0"
    },
    "kich_thuoc_dong_deu_mm": {
      "type": "decimal",
      "minimum": "0"
    },
    "loai_kich_thuoc": {
      "type": "text"
    },
    "thoi_gian_ton_tai_tb": {
      "type": "decimal",
      "minimum": "0"
    },
    "dien_bien": {
      "type": "text"
    },
    "so_luong_san_phu": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "phu_mach_ben": {
      "type": "boolean"
    },
    "vi_tri": {
      "type": "text"
    },
    "vi_tri_dac_biet_ghi_ro": {
      "type": "text"
    }
  },
  "chitiettonthuongsanphu": {
    "dang_ton_thuong": {
      "type": "text"
    },
    "kich_thuoc": {
      "type": "decimal",
      "minimum": "0"
    },
    "thoi_gian_ton_tai": {
      "type": "decimal",
      "minimum": "0"
    },
    "thoi_diem": {
      "type": "timestamp"
    },
    "tinh_trang_dung_thuoc": {
      "type": "text"
    },
    "so_luong": {
      "type": "integer",
      "min": 0,
      "max": 2147483647
    },
    "vi_tri": {
      "type": "text"
    }
  },
  "ketquacanlamsang": {
    "wbc": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "crp": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "ige_toan_phan": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "can_lam_sang_khac_ghi_chu": {
      "type": "text"
    },
    "xet_nghiem_khac": {
      "type": "text"
    },
    "thoi_diem_thuc_hien": {
      "type": "timestamp"
    }
  },
  "ketquacanlamsangcap": {
    "lym": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "neu": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "plt": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "tryptase_cap": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "tryptase_nen": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
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
      ]
    },
    "ige_khang_tpo_ket_qua": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ]
    },
    "bat_ket_qua": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ]
    },
    "ige_khang_il24_ket_qua": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh",
        "Chua lam"
      ]
    },
    "asst_duong_kinh_mm": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "eo": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "ba_bach_cau": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "anti_tpo": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "tsh": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "ft4": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "ft3": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "mau_lang_2h": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "mau_lang_1h": {
      "type": "decimal",
      "precision": 12,
      "scale": 4,
      "minimum": "0"
    },
    "ana_hep2": {
      "type": "text",
      "maxLength": 12,
      "options": [
        "Duong tinh",
        "Am tinh"
      ]
    },
    "sieu_am_tuyen_giap": {
      "type": "text"
    }
  },
  "nguoi": {
    "ho_ten": {
      "type": "text",
      "maxLength": 150
    },
    "so_dien_thoai": {
      "type": "text",
      "maxLength": 10
    },
    "ngay_sinh": {
      "type": "date"
    },
    "gioi_tinh": {
      "type": "text",
      "options": [
        "Nam",
        "Nu"
      ]
    },
    "dia_chi_tinh_tp": {
      "type": "text",
      "maxLength": 100
    },
    "dia_chi_xa_phuong": {
      "type": "text",
      "maxLength": 100
    },
    "dia_chi_so_nha_thon_pho": {
      "type": "text",
      "maxLength": 255
    }
  },
  "benhnhan": {
    "ma_his": {
      "type": "text",
      "maxLength": 50
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
      ]
    },
    "dan_toc": {
      "type": "text",
      "maxLength": 50
    },
    "bhyt_so_the": {
      "type": "text",
      "maxLength": 30
    },
    "bhyt_gia_tri_den": {
      "type": "date"
    },
    "nguoi_nha_ho_ten_dia_chi": {
      "type": "text"
    },
    "nguoi_nha_so_dien_thoai": {
      "type": "text",
      "maxLength": 10
    }
  }
};
