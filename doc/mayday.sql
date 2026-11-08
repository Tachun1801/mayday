--
-- PostgreSQL database dump
--

\restrict jkmOIwIdfBxOuYMZSSMQdQnZb35u9nKnd583E33RiJeX4bX5w4KW687fIVYx2Lt

-- Dumped from database version 17.10
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_cap_nhat_cha_kqcls(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_cap_nhat_cha_kqcls() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.ketquacanlamsang
    SET thoi_diem_cap_nhat = clock_timestamp()
    WHERE ma_ket_qua_can_lam_sang = NEW.ma_ket_qua_can_lam_sang;
    RETURN NEW;
END;
$$;


--
-- Name: fn_cap_nhat_thoi_gian(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_cap_nhat_thoi_gian() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_ARGV[0] = 'protect_tao' THEN
        NEW.thoi_diem_tao := OLD.thoi_diem_tao;
    END IF;
    NEW.thoi_diem_cap_nhat := clock_timestamp();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anhchuptonthuong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anhchuptonthuong (
    ma_anh bigint NOT NULL,
    ma_tep_dinh_kem bigint NOT NULL,
    ma_dot_ton_thuong_da bigint,
    ma_vi_tri_ton_thuong bigint,
    thoi_diem_chup timestamp with time zone NOT NULL,
    moc_tien_trien character varying(50),
    diem_ngua_nrs smallint,
    diem_dau_nrs smallint,
    diem_bong_rat_nrs smallint,
    so_luong_not_san integer,
    chi_so_auas_cuc_bo numeric(5,2),
    url_anh character varying(500),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_anh_bong_rat_nrs CHECK (((diem_bong_rat_nrs >= 0) AND (diem_bong_rat_nrs <= 10))),
    CONSTRAINT ck_anh_dau_nrs CHECK (((diem_dau_nrs >= 0) AND (diem_dau_nrs <= 10))),
    CONSTRAINT ck_anh_ngua_nrs CHECK (((diem_ngua_nrs >= 0) AND (diem_ngua_nrs <= 10))),
    CONSTRAINT ck_anh_so_luong CHECK ((so_luong_not_san >= 0)),
    CONSTRAINT ck_anh_vitri_can_dot CHECK (((ma_vi_tri_ton_thuong IS NULL) OR (ma_dot_ton_thuong_da IS NOT NULL)))
);


--
-- Name: TABLE anhchuptonthuong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.anhchuptonthuong IS 'Ảnh chụp tổn thương liên kết với tệp đính kèm.';


--
-- Name: anhchuptonthuong_ma_anh_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.anhchuptonthuong ALTER COLUMN ma_anh ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.anhchuptonthuong_ma_anh_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: benhanmaydaycap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benhanmaydaycap (
    ma_ho_so bigint NOT NULL,
    loai_benh_an text GENERATED ALWAYS AS ('CAP'::text) STORED,
    nhap_vien boolean,
    cd_soc_phan_ve boolean,
    cd_phan_ve boolean,
    cd_may_day_cap_nang boolean,
    cd_may_day_cap_thong_thuong boolean,
    tien_su_benh_nen_da text,
    tien_su_benh_nen_ho_hap text,
    tien_su_benh_nen_tuan_hoan text,
    tien_su_benh_tim_mach_ghi_ro text,
    tien_su_benh_tieu_hoa_man_tinh_ghi_ro text,
    tien_su_benh_nen_tieu_hoa text,
    nhom_yeu_to_nghi_ngo text,
    co_nghi_ngo_dot_nay boolean,
    ten_yeu_to_nghi_ngo text,
    loai_tien_su text,
    da_tung_phan_ung_truoc_day boolean,
    thoi_gian_tiep_xuc_den_khoi_phat interval,
    thoi_gian_keo_dai_tb interval,
    dot_gan_nhat_cach interval,
    tien_su_phan_ve_ghi_ro text,
    tien_su_di_ung_ghi_ro text,
    da_dieu_tri_benh_dot_nay boolean,
    tuoi_lan_dau_bi_benh integer,
    so_lan_may_day_cap_truoc integer,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    benh_phu text,
    CONSTRAINT ck_benhanmaydaycap_dot_gan_nhat CHECK ((dot_gan_nhat_cach >= '00:00:00'::interval)),
    CONSTRAINT ck_benhanmaydaycap_keo_dai CHECK ((thoi_gian_keo_dai_tb >= '00:00:00'::interval)),
    CONSTRAINT ck_benhanmaydaycap_so_lan CHECK ((so_lan_may_day_cap_truoc >= 0)),
    CONSTRAINT ck_benhanmaydaycap_tiep_xuc CHECK ((thoi_gian_tiep_xuc_den_khoi_phat >= '00:00:00'::interval)),
    CONSTRAINT ck_benhanmaydaycap_tuoi CHECK ((tuoi_lan_dau_bi_benh >= 0))
);


--
-- Name: TABLE benhanmaydaycap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benhanmaydaycap IS 'Thông tin chuyên biệt của bệnh án mề đay cấp.';


--
-- Name: benhanmaydayman; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benhanmaydayman (
    ma_ho_so bigint NOT NULL,
    loai_benh_an text GENERATED ALWAYS AS ('MAN'::text) STORED,
    chan_doan_chinh text,
    phan_nhom_csu text,
    chung_da_ve_noi boolean,
    may_day_cholinergic boolean,
    may_day_do_lanh boolean,
    may_day_adrenergic boolean,
    may_day_do_nuoc boolean,
    may_day_do_anh_sang boolean,
    may_day_cam_ung_khac boolean,
    may_day_cam_ung_khac_ghi_ro text,
    bieu_hien_qua_trinh_benh text,
    CONSTRAINT ck_benhanmaydayman_bieu_hien CHECK ((bieu_hien_qua_trinh_benh = ANY (ARRAY['Chi san phu'::text, 'Chi phu mach'::text, 'San phu + phu mach'::text]))),
    CONSTRAINT ck_benhanmaydayman_chan_doan CHECK ((chan_doan_chinh = ANY (ARRAY['CSU'::text, 'CIndU'::text, 'CSU + CIndU'::text, 'Phu mach don thuan'::text]))),
    CONSTRAINT ck_benhanmaydayman_csu CHECK ((phan_nhom_csu = ANY (ARRAY['CSU Type I'::text, 'CSU Type IIb'::text, 'Chong lap Type I + Type IIb'::text, 'Khong xac dinh'::text]))),
    CONSTRAINT ck_detail_may_day_cam_ung_khac CHECK ((((may_day_cam_ung_khac IS TRUE) AND (may_day_cam_ung_khac_ghi_ro IS NOT NULL) AND (btrim(may_day_cam_ung_khac_ghi_ro) <> ''::text)) OR ((NOT (may_day_cam_ung_khac IS TRUE)) AND (may_day_cam_ung_khac_ghi_ro IS NULL))))
);


--
-- Name: TABLE benhanmaydayman; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benhanmaydayman IS 'Thông tin chuyên biệt của bệnh án mề đay mạn.';


--
-- Name: benhnhan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benhnhan (
    ma_benh_nhan bigint NOT NULL,
    ma_his character varying(50),
    nghe_nghiep character varying(40),
    dan_toc character varying(50),
    bhyt_so_the character varying(30),
    bhyt_gia_tri_den date,
    nguoi_nha_ho_ten_dia_chi text,
    nguoi_nha_so_dien_thoai character varying(10),
    CONSTRAINT ck_benh_nhan_bhyt CHECK ((btrim((bhyt_so_the)::text) <> ''::text)),
    CONSTRAINT ck_benh_nhan_ma_his CHECK ((btrim((ma_his)::text) <> ''::text)),
    CONSTRAINT ck_benh_nhan_nghe_nghiep CHECK (((nghe_nghiep)::text = ANY ((ARRAY['Cong nhan'::character varying, 'Nong dan'::character varying, 'Hoc sinh - Sinh vien'::character varying, 'Can bo cong chuc'::character varying, 'Khac'::character varying])::text[]))),
    CONSTRAINT ck_benh_nhan_sdt_nguoi_nha CHECK (((nguoi_nha_so_dien_thoai)::text ~ '^[0-9]{10}$'::text))
);


--
-- Name: TABLE benhnhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benhnhan IS 'Subtype của Nguoi; ma_benh_nhan đồng thời là PK và FK tới Nguoi.';


--
-- Name: COLUMN benhnhan.ma_his; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.benhnhan.ma_his IS 'Mã HIS dạng chuỗi; NULL nếu chưa đồng bộ HIS.';


--
-- Name: benhsucacdotbenhtruoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benhsucacdotbenhtruoc (
    ma_tien_su bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    tung_co_dot_tuong_tu boolean,
    tuoi_khoi_phat smallint,
    so_dot_truoc integer,
    kieu_dien_bien character varying,
    bieu_hien_dot_truoc text,
    da_tung_nhap_vien boolean,
    so_lan_nhap_vien integer,
    thoi_gian_tu_dot_gan_nhat numeric,
    dien_bien_cac_dot_truoc text,
    CONSTRAINT ck_benh_su_so_dot CHECK ((so_dot_truoc >= 0)),
    CONSTRAINT ck_benh_su_so_lan_nhap_vien CHECK ((so_lan_nhap_vien >= 0)),
    CONSTRAINT ck_benh_su_thoi_gian CHECK (((thoi_gian_tu_dot_gan_nhat >= (0)::numeric) AND (thoi_gian_tu_dot_gan_nhat < 'Infinity'::numeric))),
    CONSTRAINT ck_benh_su_tuoi CHECK ((tuoi_khoi_phat >= 0))
);


--
-- Name: TABLE benhsucacdotbenhtruoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benhsucacdotbenhtruoc IS 'Bản tổng hợp bệnh sử các đợt trước của bệnh án mạn.';


--
-- Name: benhsucacdotbenhtruoc_ma_tien_su_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.benhsucacdotbenhtruoc ALTER COLUMN ma_tien_su ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.benhsucacdotbenhtruoc_ma_tien_su_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chidanngungthuoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chidanngungthuoc (
    ma_chi_dan_ngung bigint NOT NULL,
    ma_don_thuoc bigint NOT NULL,
    thuoc_can_ngung character varying(255) NOT NULL,
    ngung_tu_ngay date,
    thoi_gian_ngung_ngay integer,
    muc_dich character varying(100),
    muc_dich_khac_ghi_ro character varying(255),
    CONSTRAINT ck_chidan_muc_dich CHECK (((muc_dich IS NULL) OR ((muc_dich)::text = ANY ((ARRAY['Test huyet thanh tu than'::character varying, 'Test kich thich'::character varying, 'Khac'::character varying])::text[])))),
    CONSTRAINT ck_chidan_thoi_gian CHECK ((thoi_gian_ngung_ngay >= 0)),
    CONSTRAINT ck_ngung_mucdich_detail CHECK ((((NOT ((muc_dich)::text IS DISTINCT FROM 'Khac'::text)) AND (muc_dich_khac_ghi_ro IS NOT NULL) AND (btrim((muc_dich_khac_ghi_ro)::text) <> ''::text)) OR ((NOT (NOT ((muc_dich)::text IS DISTINCT FROM 'Khac'::text))) AND (muc_dich_khac_ghi_ro IS NULL))))
);


--
-- Name: TABLE chidanngungthuoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chidanngungthuoc IS 'Chỉ dẫn ngừng thuốc trước tái khám.';


--
-- Name: chidanngungthuoc_ma_chi_dan_ngung_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chidanngungthuoc ALTER COLUMN ma_chi_dan_ngung ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chidanngungthuoc_ma_chi_dan_ngung_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chinhanh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chinhanh (
    ma_chi_nhanh bigint NOT NULL,
    ten_chi_nhanh character varying(150) NOT NULL,
    dia_chi text NOT NULL,
    so_dien_thoai character varying(20),
    trang_thai boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_chi_nhanh_dia_chi CHECK ((btrim(dia_chi) <> ''::text)),
    CONSTRAINT ck_chi_nhanh_sdt CHECK ((btrim((so_dien_thoai)::text) <> ''::text)),
    CONSTRAINT ck_chi_nhanh_ten CHECK ((btrim((ten_chi_nhanh)::text) <> ''::text))
);


--
-- Name: TABLE chinhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chinhanh IS 'Chi nhánh phòng khám.';


--
-- Name: chinhanh_ma_chi_nhanh_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chinhanh ALTER COLUMN ma_chi_nhanh ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chinhanh_ma_chi_nhanh_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chitietdonthuoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chitietdonthuoc (
    ma_chi_tiet_don_thuoc bigint NOT NULL,
    ma_don_thuoc bigint NOT NULL,
    ma_thuoc character varying(50),
    ten_thuoc_bo_sung character varying(255),
    lieu_dung character varying(100) NOT NULL,
    thoi_gian_dung character varying(100) NOT NULL,
    ma_ke_hoach_dieu_tri character varying(50),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_ctdt_lieu_dung CHECK ((btrim((lieu_dung)::text) <> ''::text)),
    CONSTRAINT ck_ctdt_ma_ke_hoach_dieu_tri CHECK ((btrim((ma_ke_hoach_dieu_tri)::text) <> ''::text)),
    CONSTRAINT ck_ctdt_mot_thuoc CHECK (((ma_thuoc IS NOT NULL) <> (ten_thuoc_bo_sung IS NOT NULL))),
    CONSTRAINT ck_ctdt_ten_thuoc_bo_sung CHECK ((btrim((ten_thuoc_bo_sung)::text) <> ''::text)),
    CONSTRAINT ck_ctdt_thoi_gian_dung CHECK ((btrim((thoi_gian_dung)::text) <> ''::text))
);


--
-- Name: TABLE chitietdonthuoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chitietdonthuoc IS 'Chi tiết từng thuốc trong đơn.';


--
-- Name: COLUMN chitietdonthuoc.ma_ke_hoach_dieu_tri; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitietdonthuoc.ma_ke_hoach_dieu_tri IS 'Mã tham chiếu kế hoạch từ hệ thống ngoài, không phải FK nội bộ; NULL nếu không sử dụng.';


--
-- Name: chitietdonthuoc_ma_chi_tiet_don_thuoc_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chitietdonthuoc ALTER COLUMN ma_chi_tiet_don_thuoc ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chitietdonthuoc_ma_chi_tiet_don_thuoc_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chitietketquanghiemphap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chitietketquanghiemphap (
    ma_chi_tiet_ket_qua_nghiem_phap bigint NOT NULL,
    ma_phien_nghiem_phap bigint NOT NULL,
    loai_nghiem_phap bigint NOT NULL,
    ket_qua character varying(12),
    nguong_gia_tri_so numeric(12,4),
    nguong_gia_tri_chu text,
    don_vi_do character varying(30),
    diem_ngua_nrs smallint,
    diem_bong_rat_nrs smallint,
    diem_dau_nrs smallint,
    can_nguyen_khac_ten text,
    la_can_nguyen_khac boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_chi_tiet_kqnp_bong_nrs CHECK (((diem_bong_rat_nrs >= 0) AND (diem_bong_rat_nrs <= 10))),
    CONSTRAINT ck_chi_tiet_kqnp_can_nguyen CHECK ((btrim(can_nguyen_khac_ten) <> ''::text)),
    CONSTRAINT ck_chi_tiet_kqnp_dau_nrs CHECK (((diem_dau_nrs >= 0) AND (diem_dau_nrs <= 10))),
    CONSTRAINT ck_chi_tiet_kqnp_don_vi CHECK ((((nguong_gia_tri_so IS NULL) AND (nguong_gia_tri_chu IS NULL)) OR (don_vi_do IS NOT NULL))),
    CONSTRAINT ck_chi_tiet_kqnp_don_vi_val CHECK ((btrim((don_vi_do)::text) <> ''::text)),
    CONSTRAINT ck_chi_tiet_kqnp_ket_qua CHECK (((ket_qua)::text = ANY ((ARRAY['Duong tinh'::character varying, 'Am tinh'::character varying])::text[]))),
    CONSTRAINT ck_chi_tiet_kqnp_ngua_nrs CHECK (((diem_ngua_nrs >= 0) AND (diem_ngua_nrs <= 10))),
    CONSTRAINT ck_chi_tiet_kqnp_nguong CHECK (((nguong_gia_tri_so IS NULL) OR (nguong_gia_tri_chu IS NULL))),
    CONSTRAINT ck_chi_tiet_kqnp_nguong_chu CHECK ((btrim(nguong_gia_tri_chu) <> ''::text)),
    CONSTRAINT ck_chi_tiet_kqnp_nguong_khong_am CHECK ((((don_vi_do)::text <> ALL ((ARRAY['phut'::character varying, 'kg'::character varying, 'nm'::character varying, 'diem'::character varying])::text[])) OR (nguong_gia_tri_so >= (0)::numeric))),
    CONSTRAINT ck_chi_tiet_kqnp_nguong_so CHECK ((nguong_gia_tri_so < 'Infinity'::numeric)),
    CONSTRAINT ck_kqnp_can_nguyen_detail CHECK ((((la_can_nguyen_khac IS TRUE) AND (can_nguyen_khac_ten IS NOT NULL) AND (btrim(can_nguyen_khac_ten) <> ''::text)) OR ((NOT (la_can_nguyen_khac IS TRUE)) AND (can_nguyen_khac_ten IS NULL))))
);


--
-- Name: TABLE chitietketquanghiemphap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chitietketquanghiemphap IS 'Chi tiết kết quả từng loại nghiệm pháp.';


--
-- Name: COLUMN chitietketquanghiemphap.loai_nghiem_phap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitietketquanghiemphap.loai_nghiem_phap IS 'FK tới loainghiemphap.ma_nghiem_phap.';


--
-- Name: COLUMN chitietketquanghiemphap.don_vi_do; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitietketquanghiemphap.don_vi_do IS 'Quy ước: diem, phut, degC, kg, nm.';


--
-- Name: COLUMN chitietketquanghiemphap.la_can_nguyen_khac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitietketquanghiemphap.la_can_nguyen_khac IS 'Phải khớp danh mục loại nghiệm pháp; TRUE bắt buộc can_nguyen_khac_ten.';


--
-- Name: chitietketquanghiemphap_ma_chi_tiet_ket_qua_nghiem_phap_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chitietketquanghiemphap ALTER COLUMN ma_chi_tiet_ket_qua_nghiem_phap ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chitietketquanghiemphap_ma_chi_tiet_ket_qua_nghiem_phap_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chitiettonthuongcaptinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chitiettonthuongcaptinh (
    ma_chi_tiet_ton_thuong_cap_tinh bigint NOT NULL,
    ma_phien_kham bigint NOT NULL,
    dang_ton_thuong character varying,
    dang_ton_thuong_khac text,
    kich_thuoc_max_mm numeric,
    kich_thuoc_min_mm numeric,
    kich_thuoc_dong_deu_mm numeric,
    loai_kich_thuoc character varying,
    thoi_gian_ton_tai_tb numeric,
    dien_bien text,
    so_luong_san_phu integer,
    phu_mach_ben boolean,
    vi_tri text,
    vi_tri_dac_biet_ghi_ro text,
    CONSTRAINT ck_dang_tonthuong_khac CHECK ((((NOT ((dang_ton_thuong)::text IS DISTINCT FROM 'Khac'::text)) AND (dang_ton_thuong_khac IS NOT NULL) AND (btrim(dang_ton_thuong_khac) <> ''::text)) OR ((NOT (NOT ((dang_ton_thuong)::text IS DISTINCT FROM 'Khac'::text))) AND (dang_ton_thuong_khac IS NULL)))),
    CONSTRAINT ck_ton_thuong_cap_kich_thuoc_dong_deu CHECK (((kich_thuoc_dong_deu_mm >= (0)::numeric) AND (kich_thuoc_dong_deu_mm < 'Infinity'::numeric))),
    CONSTRAINT ck_ton_thuong_cap_kich_thuoc_max CHECK (((kich_thuoc_max_mm >= (0)::numeric) AND (kich_thuoc_max_mm < 'Infinity'::numeric))),
    CONSTRAINT ck_ton_thuong_cap_kich_thuoc_min CHECK (((kich_thuoc_min_mm >= (0)::numeric) AND (kich_thuoc_min_mm < 'Infinity'::numeric))),
    CONSTRAINT ck_ton_thuong_cap_min_max CHECK ((kich_thuoc_max_mm >= kich_thuoc_min_mm)),
    CONSTRAINT ck_ton_thuong_cap_so_luong CHECK ((so_luong_san_phu >= 0)),
    CONSTRAINT ck_ton_thuong_cap_thoi_gian CHECK (((thoi_gian_ton_tai_tb >= (0)::numeric) AND (thoi_gian_ton_tai_tb < 'Infinity'::numeric)))
);


--
-- Name: TABLE chitiettonthuongcaptinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chitiettonthuongcaptinh IS 'Chi tiết tổn thương ghi nhận trong phiên khám cấp.';


--
-- Name: COLUMN chitiettonthuongcaptinh.kich_thuoc_max_mm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitiettonthuongcaptinh.kich_thuoc_max_mm IS 'Đơn vị: mm.';


--
-- Name: COLUMN chitiettonthuongcaptinh.kich_thuoc_min_mm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitiettonthuongcaptinh.kich_thuoc_min_mm IS 'Đơn vị: mm.';


--
-- Name: COLUMN chitiettonthuongcaptinh.kich_thuoc_dong_deu_mm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitiettonthuongcaptinh.kich_thuoc_dong_deu_mm IS 'Đơn vị: mm.';


--
-- Name: chitiettonthuongcaptinh_ma_chi_tiet_ton_thuong_cap_tinh_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chitiettonthuongcaptinh ALTER COLUMN ma_chi_tiet_ton_thuong_cap_tinh ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chitiettonthuongcaptinh_ma_chi_tiet_ton_thuong_cap_tinh_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chitiettonthuongsanphu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chitiettonthuongsanphu (
    ma_chi_tiet_ton_thuong bigint NOT NULL,
    ma_phien_kham bigint NOT NULL,
    dang_ton_thuong character varying,
    kich_thuoc numeric,
    thoi_gian_ton_tai numeric,
    thoi_diem timestamp with time zone,
    tinh_trang_dung_thuoc character varying,
    ma_dac_diem_san_phu bigint,
    so_luong integer,
    vi_tri text,
    CONSTRAINT ck_san_phu_kich_thuoc CHECK (((kich_thuoc >= (0)::numeric) AND (kich_thuoc < 'Infinity'::numeric))),
    CONSTRAINT ck_san_phu_so_luong CHECK ((so_luong >= 0)),
    CONSTRAINT ck_san_phu_thoi_gian CHECK (((thoi_gian_ton_tai >= (0)::numeric) AND (thoi_gian_ton_tai < 'Infinity'::numeric)))
);


--
-- Name: TABLE chitiettonthuongsanphu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chitiettonthuongsanphu IS 'Chi tiết tổn thương sẩn phù trong phiên khám mạn.';


--
-- Name: chitiettonthuongsanphu_ma_chi_tiet_ton_thuong_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chitiettonthuongsanphu ALTER COLUMN ma_chi_tiet_ton_thuong ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chitiettonthuongsanphu_ma_chi_tiet_ton_thuong_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chukytheodoiuas7; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chukytheodoiuas7 (
    ma_chu_ky bigint NOT NULL,
    ma_benh_nhan bigint NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_ket_thuc date NOT NULL,
    trang_thai_chu_ky character varying(50) DEFAULT 'DANG_THEO_DOI'::character varying,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_chukyuas7_ngay CHECK ((ngay_ket_thuc = (ngay_bat_dau + 6)))
);


--
-- Name: TABLE chukytheodoiuas7; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chukytheodoiuas7 IS 'Chu kỳ theo dõi UAS7 (7 ngày).';


--
-- Name: chukytheodoiuas7_ma_chu_ky_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.chukytheodoiuas7 ALTER COLUMN ma_chu_ky ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chukytheodoiuas7_ma_chu_ky_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dacdiemsanphu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dacdiemsanphu (
    ma_dac_diem_san_phu bigint NOT NULL,
    ten_dac_diem character varying(150) NOT NULL,
    mo_ta text,
    CONSTRAINT dacdiemsanphu_ten_dac_diem_check CHECK ((btrim((ten_dac_diem)::text) <> ''::text))
);


--
-- Name: dacdiemsanphu_ma_dac_diem_san_phu_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dacdiemsanphu ALTER COLUMN ma_dac_diem_san_phu ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dacdiemsanphu_ma_dac_diem_san_phu_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: danhgiamucdohoatdongbenh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.danhgiamucdohoatdongbenh (
    ma_danh_gia_hoat_dong bigint NOT NULL,
    ma_phien_kham_man bigint NOT NULL,
    du_du_lieu_7_ngay boolean DEFAULT true,
    ma_nguoi_danh_gia bigint,
    thoi_diem_danh_gia timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hss7_san_phu_khong_dung_thuoc smallint,
    hss7_san_phu_dung_thuoc_deu smallint,
    hss7_san_phu_dung_thuoc_khong_deu smallint,
    iss7_ngua_khong_dung_thuoc smallint,
    iss7_ngua_dung_thuoc_deu smallint,
    iss7_ngua_dung_thuoc_khong_deu smallint,
    uas7_tong_khong_dung_thuoc smallint,
    uas7_tong_dung_thuoc_deu smallint,
    uas7_tong_dung_thuoc_khong_deu smallint,
    ghi_chu text,
    CONSTRAINT ck_danhgia_hss7_1 CHECK (((hss7_san_phu_khong_dung_thuoc >= 0) AND (hss7_san_phu_khong_dung_thuoc <= 21))),
    CONSTRAINT ck_danhgia_hss7_2 CHECK (((hss7_san_phu_dung_thuoc_deu >= 0) AND (hss7_san_phu_dung_thuoc_deu <= 21))),
    CONSTRAINT ck_danhgia_hss7_3 CHECK (((hss7_san_phu_dung_thuoc_khong_deu >= 0) AND (hss7_san_phu_dung_thuoc_khong_deu <= 21))),
    CONSTRAINT ck_danhgia_iss7_1 CHECK (((iss7_ngua_khong_dung_thuoc >= 0) AND (iss7_ngua_khong_dung_thuoc <= 21))),
    CONSTRAINT ck_danhgia_iss7_2 CHECK (((iss7_ngua_dung_thuoc_deu >= 0) AND (iss7_ngua_dung_thuoc_deu <= 21))),
    CONSTRAINT ck_danhgia_iss7_3 CHECK (((iss7_ngua_dung_thuoc_khong_deu >= 0) AND (iss7_ngua_dung_thuoc_khong_deu <= 21))),
    CONSTRAINT ck_danhgia_uas7_1 CHECK (((uas7_tong_khong_dung_thuoc >= 0) AND (uas7_tong_khong_dung_thuoc <= 42))),
    CONSTRAINT ck_danhgia_uas7_2 CHECK (((uas7_tong_dung_thuoc_deu >= 0) AND (uas7_tong_dung_thuoc_deu <= 42))),
    CONSTRAINT ck_danhgia_uas7_3 CHECK (((uas7_tong_dung_thuoc_khong_deu >= 0) AND (uas7_tong_dung_thuoc_khong_deu <= 42)))
);


--
-- Name: TABLE danhgiamucdohoatdongbenh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.danhgiamucdohoatdongbenh IS 'Đánh giá mức độ hoạt động bệnh theo phiên khám mạn.';


--
-- Name: COLUMN danhgiamucdohoatdongbenh.ma_nguoi_danh_gia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.danhgiamucdohoatdongbenh.ma_nguoi_danh_gia IS 'Người thực hiện đánh giá, tham chiếu nguoi; có thể là nhân viên hoặc bệnh nhân.';


--
-- Name: danhgiamucdohoatdongbenh_ma_danh_gia_hoat_dong_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.danhgiamucdohoatdongbenh ALTER COLUMN ma_danh_gia_hoat_dong ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.danhgiamucdohoatdongbenh_ma_danh_gia_hoat_dong_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dauhieusinhton; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dauhieusinhton (
    ma_dau_hieu_sinh_ton bigint NOT NULL,
    ma_phien_kham bigint NOT NULL,
    ma_bac_si bigint,
    thoi_diem timestamp with time zone,
    tri_giac character varying,
    nhiet_do numeric,
    spo2 numeric,
    mach numeric,
    huyet_ap_tam_thu numeric,
    huyet_ap_tam_truong numeric,
    nhip_tho numeric,
    bat_thuong_co_quan_khac boolean,
    bat_thuong_co_quan_khac_ghi_ro text,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_detail_bat_thuong_co_quan_khac CHECK ((((bat_thuong_co_quan_khac IS TRUE) AND (bat_thuong_co_quan_khac_ghi_ro IS NOT NULL) AND (btrim(bat_thuong_co_quan_khac_ghi_ro) <> ''::text)) OR ((NOT (bat_thuong_co_quan_khac IS TRUE)) AND (bat_thuong_co_quan_khac_ghi_ro IS NULL)))),
    CONSTRAINT ck_dhst_bat_thuong_ghi_ro CHECK ((btrim(bat_thuong_co_quan_khac_ghi_ro) <> ''::text)),
    CONSTRAINT ck_dhst_huyet_ap_tam_thu CHECK (((huyet_ap_tam_thu >= (0)::numeric) AND (huyet_ap_tam_thu < 'Infinity'::numeric))),
    CONSTRAINT ck_dhst_huyet_ap_tam_truong CHECK (((huyet_ap_tam_truong >= (0)::numeric) AND (huyet_ap_tam_truong < 'Infinity'::numeric))),
    CONSTRAINT ck_dhst_mach CHECK (((mach >= (0)::numeric) AND (mach < 'Infinity'::numeric))),
    CONSTRAINT ck_dhst_nhiet_do CHECK (((nhiet_do > '-Infinity'::numeric) AND (nhiet_do < 'Infinity'::numeric))),
    CONSTRAINT ck_dhst_nhip_tho CHECK (((nhip_tho >= (0)::numeric) AND (nhip_tho < 'Infinity'::numeric))),
    CONSTRAINT ck_dhst_spo2 CHECK (((spo2 >= (0)::numeric) AND (spo2 <= (100)::numeric)))
);


--
-- Name: TABLE dauhieusinhton; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dauhieusinhton IS 'Các lần đo dấu hiệu sinh tồn trong phiên khám.';


--
-- Name: COLUMN dauhieusinhton.nhiet_do; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dauhieusinhton.nhiet_do IS 'Đơn vị: độ C.';


--
-- Name: COLUMN dauhieusinhton.spo2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dauhieusinhton.spo2 IS 'Độ bão hòa oxy ngoại vi, đơn vị: %.';


--
-- Name: COLUMN dauhieusinhton.mach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dauhieusinhton.mach IS 'Đơn vị: lần/phút.';


--
-- Name: COLUMN dauhieusinhton.huyet_ap_tam_thu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dauhieusinhton.huyet_ap_tam_thu IS 'Đơn vị: mmHg.';


--
-- Name: COLUMN dauhieusinhton.huyet_ap_tam_truong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dauhieusinhton.huyet_ap_tam_truong IS 'Đơn vị: mmHg.';


--
-- Name: COLUMN dauhieusinhton.nhip_tho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dauhieusinhton.nhip_tho IS 'Đơn vị: lần/phút.';


--
-- Name: dauhieusinhton_ma_dau_hieu_sinh_ton_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dauhieusinhton ALTER COLUMN ma_dau_hieu_sinh_ton ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dauhieusinhton_ma_dau_hieu_sinh_ton_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: donthuoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donthuoc (
    ma_don_thuoc bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    ngay_ke_don date DEFAULT CURRENT_DATE NOT NULL,
    trang_thai_don character varying(50) DEFAULT 'DANG_DIEU_TRI'::character varying,
    ghi_chu_dieu_tri text,
    ngung_thuoc_lan_sau boolean DEFAULT false,
    thuoc_can_ngung_truoc_tai_kham text,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ma_phien_kham bigint NOT NULL,
    CONSTRAINT ck_donthuoc_ngung_detail CHECK ((((ngung_thuoc_lan_sau IS TRUE) AND (thuoc_can_ngung_truoc_tai_kham IS NOT NULL) AND (btrim(thuoc_can_ngung_truoc_tai_kham) <> ''::text)) OR ((NOT (ngung_thuoc_lan_sau IS TRUE)) AND (thuoc_can_ngung_truoc_tai_kham IS NULL)))),
    CONSTRAINT ck_donthuoc_trang_thai CHECK (((trang_thai_don)::text = ANY ((ARRAY['DANG_DIEU_TRI'::character varying, 'HOAN_THANH'::character varying, 'HUY'::character varying])::text[])))
);


--
-- Name: TABLE donthuoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.donthuoc IS 'Đơn thuốc theo hồ sơ bệnh án.';


--
-- Name: donthuoc_ma_don_thuoc_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.donthuoc ALTER COLUMN ma_don_thuoc ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.donthuoc_ma_don_thuoc_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dottonthuongda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dottonthuongda (
    ma_dot_ton_thuong_da bigint NOT NULL,
    ma_benh_nhan bigint NOT NULL,
    ma_ho_so_man bigint,
    ten_dot_ton_thuong_da character varying(255),
    thoi_diem_xuat_hien timestamp with time zone,
    hoan_canh_xuat_hien character varying(255),
    hoan_canh_xuat_hien_khac text,
    ten_thuoc_dung_gan_thoi_diem_xuat_hien character varying(255),
    thoi_gian_dung_thuoc_truoc_khi_xuat_hien character varying(100),
    don_vi_thoi_gian character varying(50),
    chi_tiet_dot_ton_thuong text,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_dottonthuongda_hoancanh CHECK ((((NOT ((hoan_canh_xuat_hien)::text IS DISTINCT FROM 'Khac'::text)) AND (hoan_canh_xuat_hien_khac IS NOT NULL) AND (btrim(hoan_canh_xuat_hien_khac) <> ''::text)) OR ((NOT (NOT ((hoan_canh_xuat_hien)::text IS DISTINCT FROM 'Khac'::text))) AND (hoan_canh_xuat_hien_khac IS NULL))))
);


--
-- Name: TABLE dottonthuongda; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dottonthuongda IS 'Đợt tổn thương da của bệnh nhân.';


--
-- Name: dottonthuongda_ma_dot_ton_thuong_da_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dottonthuongda ALTER COLUMN ma_dot_ton_thuong_da ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dottonthuongda_ma_dot_ton_thuong_da_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hoancanhkhoiphatdiung; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hoancanhkhoiphatdiung (
    ma_hoan_canh_khoi_phat bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    thuc_an_nghi_ngo text,
    thuc_an_thoi_gian numeric,
    thuc_an_tung_bi boolean,
    thuc_an_loai_tien_su character varying,
    thuc_an_tien_su_ghi_ro text,
    thuoc_nghi_ngo text,
    thuoc_thoi_gian numeric,
    thuoc_tung_bi boolean,
    thuoc_loai_tien_su character varying,
    thuoc_tien_su_ghi_ro text,
    con_trung_nghi_ngo text,
    con_trung_thoi_gian numeric,
    con_trung_tung_bi boolean,
    con_trung_loai_tien_su character varying,
    con_trung_tien_su_ghi_ro text,
    khac_nghi_ngo text,
    khac_thoi_gian numeric,
    khac_tung_bi boolean,
    khac_loai_tien_su character varying,
    khac_tien_su_ghi_ro text,
    CONSTRAINT ck_hoan_canh_con_trung_thoi_gian CHECK (((con_trung_thoi_gian >= (0)::numeric) AND (con_trung_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_hoan_canh_khac_thoi_gian CHECK (((khac_thoi_gian >= (0)::numeric) AND (khac_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_hoan_canh_thuc_an_thoi_gian CHECK (((thuc_an_thoi_gian >= (0)::numeric) AND (thuc_an_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_hoan_canh_thuoc_thoi_gian CHECK (((thuoc_thoi_gian >= (0)::numeric) AND (thuoc_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_hoancanh_con_trung_tiensu CHECK ((((con_trung_tung_bi IS TRUE) AND (con_trung_tien_su_ghi_ro IS NOT NULL) AND (btrim(con_trung_tien_su_ghi_ro) <> ''::text)) OR ((NOT (con_trung_tung_bi IS TRUE)) AND (con_trung_tien_su_ghi_ro IS NULL)))),
    CONSTRAINT ck_hoancanh_khac_tiensu CHECK ((((khac_tung_bi IS TRUE) AND (khac_tien_su_ghi_ro IS NOT NULL) AND (btrim(khac_tien_su_ghi_ro) <> ''::text)) OR ((NOT (khac_tung_bi IS TRUE)) AND (khac_tien_su_ghi_ro IS NULL)))),
    CONSTRAINT ck_hoancanh_thuc_an_tiensu CHECK ((((thuc_an_tung_bi IS TRUE) AND (thuc_an_tien_su_ghi_ro IS NOT NULL) AND (btrim(thuc_an_tien_su_ghi_ro) <> ''::text)) OR ((NOT (thuc_an_tung_bi IS TRUE)) AND (thuc_an_tien_su_ghi_ro IS NULL)))),
    CONSTRAINT ck_hoancanh_thuoc_tiensu CHECK ((((thuoc_tung_bi IS TRUE) AND (thuoc_tien_su_ghi_ro IS NOT NULL) AND (btrim(thuoc_tien_su_ghi_ro) <> ''::text)) OR ((NOT (thuoc_tung_bi IS TRUE)) AND (thuoc_tien_su_ghi_ro IS NULL))))
);


--
-- Name: TABLE hoancanhkhoiphatdiung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hoancanhkhoiphatdiung IS 'Hoàn cảnh khởi phát dị ứng ghi nhận theo hồ sơ.';


--
-- Name: hoancanhkhoiphatdiung_ma_hoan_canh_khoi_phat_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.hoancanhkhoiphatdiung ALTER COLUMN ma_hoan_canh_khoi_phat ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.hoancanhkhoiphatdiung_ma_hoan_canh_khoi_phat_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hosobenhan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hosobenhan (
    ma_ho_so bigint NOT NULL,
    ma_benh_nhan bigint NOT NULL,
    loai_benh_an text NOT NULL,
    ma_subtype_cap bigint GENERATED ALWAYS AS (
CASE
    WHEN (loai_benh_an = 'CAP'::text) THEN ma_ho_so
    ELSE NULL::bigint
END) STORED,
    ma_subtype_man bigint GENERATED ALWAYS AS (
CASE
    WHEN (loai_benh_an = 'MAN'::text) THEN ma_ho_so
    ELSE NULL::bigint
END) STORED,
    thoi_diem_kham_lan_dau timestamp with time zone,
    ngay_bat_dau_dieu_tri_ngoai_tru date,
    ngay_ket_thuc_dieu_tri_ngoai_tru date,
    chan_doan_tuyen_truoc text,
    chan_doan_ban_dau_phong_kham text,
    ket_qua_dieu_tri_bao_hiem text,
    thoi_gian_khoi_phat_tuan numeric(12,2),
    trang_thai text DEFAULT 'draft'::text NOT NULL,
    tien_su_gia_dinh text,
    tien_su_gia_dinh_ghi_ro text,
    da_dieu_tri_truoc_kham boolean,
    CONSTRAINT ck_hoso_giadinh_detail CHECK ((((NOT (tien_su_gia_dinh IS DISTINCT FROM 'Co'::text)) AND (tien_su_gia_dinh_ghi_ro IS NOT NULL) AND (btrim(tien_su_gia_dinh_ghi_ro) <> ''::text)) OR ((NOT (NOT (tien_su_gia_dinh IS DISTINCT FROM 'Co'::text))) AND (tien_su_gia_dinh_ghi_ro IS NULL)))),
    CONSTRAINT ck_hosobenhan_ket_qua CHECK ((ket_qua_dieu_tri_bao_hiem = ANY (ARRAY['Khoi benh'::text, 'Do'::text, 'Khong do'::text, 'Nang hon'::text, 'Chet'::text, 'Bien chung'::text]))),
    CONSTRAINT ck_hosobenhan_loai CHECK ((loai_benh_an = ANY (ARRAY['CAP'::text, 'MAN'::text]))),
    CONSTRAINT ck_hosobenhan_ngay_dieu_tri CHECK ((ngay_ket_thuc_dieu_tri_ngoai_tru >= ngay_bat_dau_dieu_tri_ngoai_tru)),
    CONSTRAINT ck_hosobenhan_thoi_gian CHECK (((thoi_gian_khoi_phat_tuan >= (0)::numeric) AND (thoi_gian_khoi_phat_tuan < 'Infinity'::numeric))),
    CONSTRAINT ck_hosobenhan_tien_su_gia_dinh CHECK ((tien_su_gia_dinh = ANY (ARRAY['Co'::text, 'Khong'::text, 'Khong ro'::text]))),
    CONSTRAINT ck_hosobenhan_trang_thai CHECK ((trang_thai = ANY (ARRAY['draft'::text, 'pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: TABLE hosobenhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hosobenhan IS 'Hồ sơ bệnh án của bệnh nhân; phân loại cấp hoặc mạn.';


--
-- Name: hosobenhan_ma_ho_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.hosobenhan ALTER COLUMN ma_ho_so ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.hosobenhan_ma_ho_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ketquacanlamsang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ketquacanlamsang (
    ma_ket_qua_can_lam_sang bigint NOT NULL,
    ma_phien_kham bigint NOT NULL,
    loai_ket_qua_can_lam_sang character varying(3) NOT NULL,
    wbc numeric(12,4),
    crp numeric(12,4),
    ige_toan_phan numeric(12,4),
    can_lam_sang_khac_ghi_chu text,
    xet_nghiem_khac text,
    thoi_diem_thuc_hien timestamp with time zone,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ma_subtype_cap bigint GENERATED ALWAYS AS (
CASE
    WHEN ((loai_ket_qua_can_lam_sang)::text = 'CAP'::text) THEN ma_ket_qua_can_lam_sang
    ELSE NULL::bigint
END) STORED,
    ma_subtype_man bigint GENERATED ALWAYS AS (
CASE
    WHEN ((loai_ket_qua_can_lam_sang)::text = 'MAN'::text) THEN ma_ket_qua_can_lam_sang
    ELSE NULL::bigint
END) STORED,
    CONSTRAINT ck_kqcls_crp CHECK (((crp >= (0)::numeric) AND (crp < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_ige CHECK (((ige_toan_phan >= (0)::numeric) AND (ige_toan_phan < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_loai CHECK (((loai_ket_qua_can_lam_sang)::text = ANY ((ARRAY['CAP'::character varying, 'MAN'::character varying])::text[]))),
    CONSTRAINT ck_kqcls_wbc CHECK (((wbc >= (0)::numeric) AND (wbc < 'Infinity'::numeric)))
);


--
-- Name: TABLE ketquacanlamsang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ketquacanlamsang IS 'Supertype kết quả cận lâm sàng.';


--
-- Name: COLUMN ketquacanlamsang.wbc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsang.wbc IS 'Đơn vị: G/L';


--
-- Name: COLUMN ketquacanlamsang.crp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsang.crp IS 'Đơn vị: mg/L';


--
-- Name: COLUMN ketquacanlamsang.ige_toan_phan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsang.ige_toan_phan IS 'Đơn vị: IU/mL';


--
-- Name: ketquacanlamsang_ma_ket_qua_can_lam_sang_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ketquacanlamsang ALTER COLUMN ma_ket_qua_can_lam_sang ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ketquacanlamsang_ma_ket_qua_can_lam_sang_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ketquacanlamsangcap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ketquacanlamsangcap (
    ma_ket_qua_can_lam_sang bigint NOT NULL,
    loai_ket_qua_can_lam_sang character varying(3) GENERATED ALWAYS AS ('CAP'::character varying(3)) STORED,
    lym numeric(12,4),
    neu numeric(12,4),
    plt numeric(12,4),
    tryptase_cap numeric(12,4),
    tryptase_nen numeric(12,4),
    nlr numeric GENERATED ALWAYS AS (round((neu / NULLIF(lym, (0)::numeric)), 6)) STORED,
    plr numeric GENERATED ALWAYS AS (round((plt / NULLIF(lym, (0)::numeric)), 6)) STORED,
    CONSTRAINT ck_kqcls_cap_lym CHECK (((lym >= (0)::numeric) AND (lym < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_cap_neu CHECK (((neu >= (0)::numeric) AND (neu < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_cap_plt CHECK (((plt >= (0)::numeric) AND (plt < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_cap_tryptase_cap CHECK (((tryptase_cap >= (0)::numeric) AND (tryptase_cap < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_cap_tryptase_nen CHECK (((tryptase_nen >= (0)::numeric) AND (tryptase_nen < 'Infinity'::numeric)))
);


--
-- Name: TABLE ketquacanlamsangcap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ketquacanlamsangcap IS 'Subtype cấp; NLR và PLR tự tính từ NEU, PLT, LYM.';


--
-- Name: COLUMN ketquacanlamsangcap.lym; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.lym IS 'Đơn vị: G/L';


--
-- Name: COLUMN ketquacanlamsangcap.neu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.neu IS 'Đơn vị: G/L';


--
-- Name: COLUMN ketquacanlamsangcap.plt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.plt IS 'Đơn vị: G/L';


--
-- Name: COLUMN ketquacanlamsangcap.tryptase_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.tryptase_cap IS 'Đơn vị: ng/mL';


--
-- Name: COLUMN ketquacanlamsangcap.tryptase_nen; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.tryptase_nen IS 'Đơn vị: ng/mL';


--
-- Name: COLUMN ketquacanlamsangcap.nlr; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.nlr IS 'Tỷ số NEU/LYM, tự tính.';


--
-- Name: COLUMN ketquacanlamsangcap.plr; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangcap.plr IS 'Tỷ số PLT/LYM, tự tính.';


--
-- Name: ketquacanlamsangman; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ketquacanlamsangman (
    ma_ket_qua_can_lam_sang bigint NOT NULL,
    loai_ket_qua_can_lam_sang character varying(3) GENERATED ALWAYS AS ('MAN'::character varying(3)) STORED,
    test_huyet_thanh_tu_than character varying(12),
    ige_khang_tpo_ket_qua character varying(12),
    bat_ket_qua character varying(12),
    ige_khang_il24_ket_qua character varying(12),
    asst_duong_kinh_mm numeric(12,4),
    eo numeric(12,4),
    ba_bach_cau numeric(12,4),
    anti_tpo numeric(12,4),
    tsh numeric(12,4),
    ft4 numeric(12,4),
    ft3 numeric(12,4),
    mau_lang_2h numeric(12,4),
    mau_lang_1h numeric(12,4),
    ana_hep2 character varying(12),
    sieu_am_tuyen_giap text,
    CONSTRAINT ck_kqcls_man_ana CHECK (((ana_hep2)::text = ANY ((ARRAY['Duong tinh'::character varying, 'Am tinh'::character varying])::text[]))),
    CONSTRAINT ck_kqcls_man_anti_tpo CHECK (((anti_tpo >= (0)::numeric) AND (anti_tpo < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_asst CHECK (((asst_duong_kinh_mm >= (0)::numeric) AND (asst_duong_kinh_mm < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_asst_logic CHECK (((asst_duong_kinh_mm IS NULL) OR (NOT ((test_huyet_thanh_tu_than)::text IS DISTINCT FROM 'Duong tinh'::text)))),
    CONSTRAINT ck_kqcls_man_ba CHECK (((ba_bach_cau >= (0)::numeric) AND (ba_bach_cau < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_bat CHECK (((bat_ket_qua)::text = ANY ((ARRAY['Duong tinh'::character varying, 'Am tinh'::character varying, 'Chua lam'::character varying])::text[]))),
    CONSTRAINT ck_kqcls_man_eo CHECK (((eo >= (0)::numeric) AND (eo < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_ft3 CHECK (((ft3 >= (0)::numeric) AND (ft3 < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_ft4 CHECK (((ft4 >= (0)::numeric) AND (ft4 < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_ige_il24 CHECK (((ige_khang_il24_ket_qua)::text = ANY ((ARRAY['Duong tinh'::character varying, 'Am tinh'::character varying, 'Chua lam'::character varying])::text[]))),
    CONSTRAINT ck_kqcls_man_ige_tpo CHECK (((ige_khang_tpo_ket_qua)::text = ANY ((ARRAY['Duong tinh'::character varying, 'Am tinh'::character varying, 'Chua lam'::character varying])::text[]))),
    CONSTRAINT ck_kqcls_man_ml_1h CHECK (((mau_lang_1h >= (0)::numeric) AND (mau_lang_1h < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_ml_2h CHECK (((mau_lang_2h >= (0)::numeric) AND (mau_lang_2h < 'Infinity'::numeric))),
    CONSTRAINT ck_kqcls_man_test_ht CHECK (((test_huyet_thanh_tu_than)::text = ANY ((ARRAY['Duong tinh'::character varying, 'Am tinh'::character varying, 'Chua lam'::character varying])::text[]))),
    CONSTRAINT ck_kqcls_man_tsh CHECK (((tsh >= (0)::numeric) AND (tsh < 'Infinity'::numeric)))
);


--
-- Name: TABLE ketquacanlamsangman; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ketquacanlamsangman IS 'Subtype mạn; IgE kháng TPO định tính khác anti_tpo định lượng.';


--
-- Name: COLUMN ketquacanlamsangman.asst_duong_kinh_mm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.asst_duong_kinh_mm IS 'Đơn vị: mm';


--
-- Name: COLUMN ketquacanlamsangman.eo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.eo IS 'Đơn vị: G/L';


--
-- Name: COLUMN ketquacanlamsangman.ba_bach_cau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.ba_bach_cau IS 'Đơn vị: G/L';


--
-- Name: COLUMN ketquacanlamsangman.anti_tpo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.anti_tpo IS 'Đơn vị: IU/mL';


--
-- Name: COLUMN ketquacanlamsangman.tsh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.tsh IS 'Đơn vị: micro-IU/mL';


--
-- Name: COLUMN ketquacanlamsangman.ft4; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.ft4 IS 'Đơn vị: pmol/L';


--
-- Name: COLUMN ketquacanlamsangman.ft3; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.ft3 IS 'Đơn vị: pmol/L';


--
-- Name: COLUMN ketquacanlamsangman.mau_lang_2h; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.mau_lang_2h IS 'Đơn vị: mm';


--
-- Name: COLUMN ketquacanlamsangman.mau_lang_1h; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ketquacanlamsangman.mau_lang_1h IS 'Đơn vị: mm';


--
-- Name: ketquaproms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ketquaproms (
    ma_ket_qua_proms bigint NOT NULL,
    ma_phien_kham_man bigint NOT NULL,
    uct_diem smallint,
    aect_diem smallint,
    act_diem_legacy smallint,
    dlqi_diem smallint,
    cu_q2ol_diem numeric(5,2),
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_proms_act CHECK (((act_diem_legacy >= 0) AND (act_diem_legacy <= 16))),
    CONSTRAINT ck_proms_aect CHECK (((aect_diem >= 0) AND (aect_diem <= 16))),
    CONSTRAINT ck_proms_cu_q2ol CHECK ((cu_q2ol_diem >= (0)::numeric)),
    CONSTRAINT ck_proms_dlqi CHECK (((dlqi_diem >= 0) AND (dlqi_diem <= 30))),
    CONSTRAINT ck_proms_uct CHECK (((uct_diem >= 0) AND (uct_diem <= 16)))
);


--
-- Name: TABLE ketquaproms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ketquaproms IS 'Kết quả đo lường PROMs (UCT, AE-CT, DLQI, CU-Q2oL).';


--
-- Name: ketquaproms_ma_ket_qua_proms_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ketquaproms ALTER COLUMN ma_ket_qua_proms ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ketquaproms_ma_ket_qua_proms_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: khoaphong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.khoaphong (
    ma_khoa_phong bigint NOT NULL,
    ten_khoa_phong character varying(150) NOT NULL,
    loai_khoa character varying(50) NOT NULL,
    mo_ta text,
    ma_chi_nhanh bigint NOT NULL,
    CONSTRAINT ck_khoa_phong_loai CHECK ((btrim((loai_khoa)::text) <> ''::text)),
    CONSTRAINT ck_khoa_phong_ten CHECK ((btrim((ten_khoa_phong)::text) <> ''::text))
);


--
-- Name: khoaphong_ma_khoa_phong_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.khoaphong ALTER COLUMN ma_khoa_phong ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.khoaphong_ma_khoa_phong_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: loainghiemphap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loainghiemphap (
    ma_nghiem_phap bigint NOT NULL,
    ten_nghiem_phap character varying(150) NOT NULL,
    phuong_phap_thuc_hien text,
    thoi_gian_chuan numeric(10,2),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    la_can_nguyen_khac boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_loai_nghiem_phap_ten CHECK ((btrim((ten_nghiem_phap)::text) <> ''::text)),
    CONSTRAINT ck_loai_nghiem_phap_thoi_gian CHECK ((thoi_diem_cap_nhat >= thoi_diem_tao)),
    CONSTRAINT ck_loai_nghiem_phap_thoi_gian_chuan CHECK (((thoi_gian_chuan >= (0)::numeric) AND (thoi_gian_chuan < 'Infinity'::numeric)))
);


--
-- Name: TABLE loainghiemphap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.loainghiemphap IS 'Danh mục loại nghiệm pháp kích thích.';


--
-- Name: COLUMN loainghiemphap.thoi_gian_chuan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loainghiemphap.thoi_gian_chuan IS 'Quy ước: phút. NULL nếu chưa xác định.';


--
-- Name: loainghiemphap_ma_nghiem_phap_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.loainghiemphap ALTER COLUMN ma_nghiem_phap ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.loainghiemphap_ma_nghiem_phap_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nguoi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nguoi (
    ma_nguoi bigint NOT NULL,
    ho_ten character varying(150) NOT NULL,
    ngay_sinh date,
    gioi_tinh character varying(3),
    so_dien_thoai character varying(10) NOT NULL,
    dia_chi_tinh_tp character varying(100),
    dia_chi_xa_phuong character varying(100),
    dia_chi_so_nha_thon_pho character varying(255),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_nguoi_gioi_tinh CHECK (((gioi_tinh)::text = ANY ((ARRAY['Nam'::character varying, 'Nu'::character varying])::text[]))),
    CONSTRAINT ck_nguoi_ho_ten CHECK ((btrim((ho_ten)::text) <> ''::text)),
    CONSTRAINT ck_nguoi_ngay_sinh CHECK ((ngay_sinh <= CURRENT_DATE)),
    CONSTRAINT ck_nguoi_sdt CHECK (((so_dien_thoai)::text ~ '^[0-9]{10}$'::text)),
    CONSTRAINT ck_nguoi_thoi_gian CHECK ((thoi_diem_cap_nhat >= thoi_diem_tao))
);


--
-- Name: TABLE nguoi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nguoi IS 'Supertype: thông tin chung của bệnh nhân và nhân viên.';


--
-- Name: COLUMN nguoi.so_dien_thoai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nguoi.so_dien_thoai IS '10 chữ số; không UNIQUE vì người thân có thể dùng chung số.';


--
-- Name: nguoi_ma_nguoi_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.nguoi ALTER COLUMN ma_nguoi ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nguoi_ma_nguoi_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nhanvien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhanvien (
    ma_nhan_vien bigint NOT NULL,
    ma_chi_nhanh bigint NOT NULL
);


--
-- Name: TABLE nhanvien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nhanvien IS 'Subtype của Nguoi; mỗi nhân viên thuộc một chi nhánh.';


--
-- Name: nhatkyaashangngay; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhatkyaashangngay (
    ma_nhat_ky_aas bigint NOT NULL,
    ma_benh_nhan bigint NOT NULL,
    ma_ho_so_man bigint,
    ngay_theo_doi date NOT NULL,
    co_dot_sung_phu boolean DEFAULT false NOT NULL,
    thoi_diem_xuat_hien character varying(50),
    muc_kho_chiu smallint,
    han_che_hoat_dong smallint,
    anh_huong_ngoai_hinh smallint,
    do_nang_tong_the smallint,
    diem_aas_ngay smallint GENERATED ALWAYS AS (
CASE
    WHEN (co_dot_sung_phu = true) THEN ((((muc_kho_chiu + han_che_hoat_dong) + anh_huong_ngoai_hinh) + do_nang_tong_the))::integer
    ELSE 0
END) STORED,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_aas_day_du_diem CHECK (((co_dot_sung_phu AND (muc_kho_chiu IS NOT NULL) AND (han_che_hoat_dong IS NOT NULL) AND (anh_huong_ngoai_hinh IS NOT NULL) AND (do_nang_tong_the IS NOT NULL)) OR ((NOT co_dot_sung_phu) AND (muc_kho_chiu IS NULL) AND (han_che_hoat_dong IS NULL) AND (anh_huong_ngoai_hinh IS NULL) AND (do_nang_tong_the IS NULL)))),
    CONSTRAINT ck_aas_do_nang CHECK (((do_nang_tong_the >= 0) AND (do_nang_tong_the <= 3))),
    CONSTRAINT ck_aas_han_che CHECK (((han_che_hoat_dong >= 0) AND (han_che_hoat_dong <= 3))),
    CONSTRAINT ck_aas_kho_chiu CHECK (((muc_kho_chiu >= 0) AND (muc_kho_chiu <= 3))),
    CONSTRAINT ck_aas_ngoai_hinh CHECK (((anh_huong_ngoai_hinh >= 0) AND (anh_huong_ngoai_hinh <= 3)))
);


--
-- Name: TABLE nhatkyaashangngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nhatkyaashangngay IS 'Nhật ký AAS hằng ngày (phù mạch).';


--
-- Name: nhatkyaashangngay_ma_nhat_ky_aas_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.nhatkyaashangngay ALTER COLUMN ma_nhat_ky_aas ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nhatkyaashangngay_ma_nhat_ky_aas_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nhatkyuashangngay; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhatkyuashangngay (
    ma_nhat_ky_uas bigint NOT NULL,
    ma_chu_ky bigint,
    ma_ho_so_man bigint,
    ma_benh_nhan bigint NOT NULL,
    ngay_cham_diem date NOT NULL,
    ngay_thu_may_trong_chu_ky smallint,
    diem_san_phu_hss smallint NOT NULL,
    diem_ngua_iss smallint NOT NULL,
    diem_uas_ngay smallint GENERATED ALWAYS AS ((diem_san_phu_hss + diem_ngua_iss)) STORED,
    trang_thai_dung_thuoc character varying(50),
    trang_thai_ngay character varying(50) DEFAULT 'HOP_LE'::character varying NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ngay_bat_dau_chu_ky date GENERATED ALWAYS AS ((ngay_cham_diem - ((ngay_thu_may_trong_chu_ky)::integer - 1))) STORED,
    CONSTRAINT ck_nhatkyuas_hss CHECK (((diem_san_phu_hss >= 0) AND (diem_san_phu_hss <= 3))),
    CONSTRAINT ck_nhatkyuas_iss CHECK (((diem_ngua_iss >= 0) AND (diem_ngua_iss <= 3))),
    CONSTRAINT ck_nhatkyuas_thu_may CHECK (((ngay_thu_may_trong_chu_ky >= 1) AND (ngay_thu_may_trong_chu_ky <= 7))),
    CONSTRAINT ck_uas_chuky_ngay CHECK (((ma_chu_ky IS NULL) = (ngay_thu_may_trong_chu_ky IS NULL))),
    CONSTRAINT ck_uas_trangthai CHECK (((trang_thai_ngay)::text = ANY ((ARRAY['HOP_LE'::character varying, 'KHONG_HOP_LE'::character varying])::text[])))
);


--
-- Name: TABLE nhatkyuashangngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nhatkyuashangngay IS 'Nhật ký UAS hằng ngày của bệnh nhân.';


--
-- Name: nhatkyuashangngay_ma_nhat_ky_uas_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.nhatkyuashangngay ALTER COLUMN ma_nhat_ky_uas ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nhatkyuashangngay_ma_nhat_ky_uas_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: phienkham; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phienkham (
    ma_phien_kham bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    ma_bac_si bigint NOT NULL,
    ma_phong_kham bigint,
    loai_benh_an text NOT NULL,
    ma_subtype_cap bigint GENERATED ALWAYS AS (
CASE
    WHEN (loai_benh_an = 'CAP'::text) THEN ma_phien_kham
    ELSE NULL::bigint
END) STORED,
    ma_subtype_man bigint GENERATED ALWAYS AS (
CASE
    WHEN (loai_benh_an = 'MAN'::text) THEN ma_phien_kham
    ELSE NULL::bigint
END) STORED,
    ngay_kham date NOT NULL,
    lan_kham_thu integer NOT NULL,
    loai_phien_kham text,
    luu_huyet_thanh boolean,
    sot boolean,
    sot_nhiet_do_c numeric(4,1),
    ngay_hen_tai_kham date,
    tom_tat_buoi_kham text,
    huong_xu_tri_lan_sau text,
    dan_do text,
    CONSTRAINT ck_phienkham_lan_kham CHECK ((lan_kham_thu > 0)),
    CONSTRAINT ck_phienkham_loai CHECK ((loai_benh_an = ANY (ARRAY['CAP'::text, 'MAN'::text]))),
    CONSTRAINT ck_phienkham_ngay_hen CHECK ((ngay_hen_tai_kham >= ngay_kham)),
    CONSTRAINT ck_phienkham_nhiet_do CHECK (((sot_nhiet_do_c > (0)::numeric) AND (sot_nhiet_do_c < 'Infinity'::numeric)))
);


--
-- Name: TABLE phienkham; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.phienkham IS 'Các lần khám thuộc một hồ sơ bệnh án.';


--
-- Name: COLUMN phienkham.ma_phong_kham; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.phienkham.ma_phong_kham IS 'FK tới danh mục phòng khám; NULL khi chưa phân phòng.';


--
-- Name: COLUMN phienkham.sot_nhiet_do_c; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.phienkham.sot_nhiet_do_c IS 'Đơn vị: độ C.';


--
-- Name: phienkham_ma_phien_kham_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.phienkham ALTER COLUMN ma_phien_kham ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.phienkham_ma_phien_kham_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: phienkhamcap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phienkhamcap (
    ma_phien_kham bigint NOT NULL,
    loai_benh_an text GENERATED ALWAYS AS ('CAP'::text) STORED,
    trieu_chung_da text,
    trieu_chung_ho_hap text,
    so_voi_thuong_ngay_ho_hap text,
    trieu_chung_tuan_hoan text,
    so_voi_thuong_ngay_tuan_hoan text,
    trieu_chung_tieu_hoa text,
    so_voi_thuong_ngay_tieu_hoa text,
    co_san_phu boolean,
    co_anh_san_phu boolean,
    so_lan_non integer,
    CONSTRAINT ck_phienkhamcap_so_lan_non CHECK ((so_lan_non >= 0))
);


--
-- Name: TABLE phienkhamcap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.phienkhamcap IS 'Thông tin chuyên biệt của phiên khám cấp.';


--
-- Name: phienkhamman; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phienkhamman (
    ma_phien_kham bigint NOT NULL,
    loai_benh_an text GENERATED ALWAYS AS ('MAN'::text) STORED,
    hien_tai_co_san_phu boolean,
    uu_the_ngau_nhien boolean,
    vi_tri_san_phu text,
    yeu_to_lam_nang_sa_phu text,
    hoan_canh_xuat_hien_san_phu text,
    trong_dot_co_phu_mach boolean,
    hien_tai_co_phu_mach boolean,
    so_lan_phu_mach_dot_nay integer,
    hoan_canh_xuat_hien_phu_mach text,
    so_lan_phu_mach_nang_phai_nhap_vien integer,
    thoi_gian_ton_tai_phu_mach_co_dung_thuoc text,
    thoi_gian_ton_tai_phu_mach_khong_dung_thuoc text,
    diem_aas7 smallint,
    ben_phu_mach text,
    thoi_gian_ngau_nhien_tuan numeric(12,2),
    uu_the_kich_thich boolean,
    thoi_gian_kich_thich_tuan numeric(12,2),
    uu_the_tuong_duong boolean,
    uu_the_khong_ro boolean,
    thu_tu_xuat_hien_so_voi_san_phu text,
    phu_mach_1_tuan_gan_day boolean,
    chan_doan_tai_kham text,
    khoang_cach_xuat_hien text,
    phu_mi_mat boolean,
    phu_luoi boolean,
    phu_moi boolean,
    phu_vung_mat_khac boolean,
    phu_thanh_quan boolean,
    phu_ban_chan boolean,
    phu_sinh_duc boolean,
    phu_vi_tri_khac boolean,
    phu_vi_tri_khac_ghi_ro text,
    phu_ban_tay boolean,
    CONSTRAINT ck_detail_phu_vi_tri_khac CHECK ((((phu_vi_tri_khac IS TRUE) AND (phu_vi_tri_khac_ghi_ro IS NOT NULL) AND (btrim(phu_vi_tri_khac_ghi_ro) <> ''::text)) OR ((NOT (phu_vi_tri_khac IS TRUE)) AND (phu_vi_tri_khac_ghi_ro IS NULL)))),
    CONSTRAINT ck_phienkhamman_aas7 CHECK (((diem_aas7 >= 0) AND (diem_aas7 <= 105))),
    CONSTRAINT ck_phienkhamman_so_lan_nhap_vien CHECK ((so_lan_phu_mach_nang_phai_nhap_vien >= 0)),
    CONSTRAINT ck_phienkhamman_so_lan_phu CHECK ((so_lan_phu_mach_dot_nay >= 0)),
    CONSTRAINT ck_phienkhamman_tuan_kich_thich CHECK (((thoi_gian_kich_thich_tuan >= (0)::numeric) AND (thoi_gian_kich_thich_tuan < 'Infinity'::numeric))),
    CONSTRAINT ck_phienkhamman_tuan_ngau_nhien CHECK (((thoi_gian_ngau_nhien_tuan >= (0)::numeric) AND (thoi_gian_ngau_nhien_tuan < 'Infinity'::numeric)))
);


--
-- Name: TABLE phienkhamman; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.phienkhamman IS 'Thông tin chuyên biệt của phiên khám mạn.';


--
-- Name: COLUMN phienkhamman.diem_aas7; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.phienkhamman.diem_aas7 IS 'Điểm AAS7, từ 0 đến 105.';


--
-- Name: phiennghiemphapkichthich; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phiennghiemphapkichthich (
    ma_phien_nghiem_phap bigint NOT NULL,
    ma_phien_kham bigint NOT NULL,
    ngung_khang_histamine boolean,
    thoi_gian_ngung_histamine numeric(8,2),
    ngung_corticoid boolean,
    thoi_gian_ngung_corticoid numeric(8,2),
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_phien_np_corticoid CHECK (((thoi_gian_ngung_corticoid IS NULL) OR (ngung_corticoid IS TRUE))),
    CONSTRAINT ck_phien_np_corticoid_val CHECK (((thoi_gian_ngung_corticoid >= (0)::numeric) AND (thoi_gian_ngung_corticoid < 'Infinity'::numeric))),
    CONSTRAINT ck_phien_np_histamine CHECK (((thoi_gian_ngung_histamine IS NULL) OR (ngung_khang_histamine IS TRUE))),
    CONSTRAINT ck_phien_np_histamine_val CHECK (((thoi_gian_ngung_histamine >= (0)::numeric) AND (thoi_gian_ngung_histamine < 'Infinity'::numeric)))
);


--
-- Name: TABLE phiennghiemphapkichthich; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.phiennghiemphapkichthich IS 'Phiên nghiệm pháp kích thích (1:1 với phiên khám mạn).';


--
-- Name: COLUMN phiennghiemphapkichthich.thoi_gian_ngung_histamine; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.phiennghiemphapkichthich.thoi_gian_ngung_histamine IS 'Đơn vị: ngày.';


--
-- Name: COLUMN phiennghiemphapkichthich.thoi_gian_ngung_corticoid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.phiennghiemphapkichthich.thoi_gian_ngung_corticoid IS 'Đơn vị: ngày.';


--
-- Name: phiennghiemphapkichthich_ma_phien_nghiem_phap_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.phiennghiemphapkichthich ALTER COLUMN ma_phien_nghiem_phap ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.phiennghiemphapkichthich_ma_phien_nghiem_phap_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: phongkham; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phongkham (
    ma_phong_kham bigint NOT NULL,
    ten_phong_kham character varying(150) NOT NULL,
    ma_chi_nhanh bigint NOT NULL,
    CONSTRAINT phongkham_ten_phong_kham_check CHECK ((btrim((ten_phong_kham)::text) <> ''::text))
);


--
-- Name: phongkham_ma_phong_kham_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.phongkham ALTER COLUMN ma_phong_kham ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.phongkham_ma_phong_kham_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quyenhan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quyenhan (
    ma_quyen_han bigint NOT NULL,
    ten_quyen_han character varying(100) NOT NULL,
    nhom_quyen character varying(100),
    mo_ta text,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_quyen_han_nhom CHECK ((btrim((nhom_quyen)::text) <> ''::text)),
    CONSTRAINT ck_quyen_han_ten CHECK ((btrim((ten_quyen_han)::text) <> ''::text)),
    CONSTRAINT ck_quyen_han_thoi_gian CHECK ((thoi_diem_cap_nhat >= thoi_diem_tao))
);


--
-- Name: TABLE quyenhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.quyenhan IS 'Danh mục quyền hạn ứng dụng.';


--
-- Name: quyenhan_ma_quyen_han_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quyenhan ALTER COLUMN ma_quyen_han ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quyenhan_ma_quyen_han_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sanglocbaodongdo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sanglocbaodongdo (
    ma_luot_sang_loc bigint NOT NULL,
    ma_phien_ung_dung uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_benh_nhan bigint,
    phien_ban_bo_cau_hoi character varying(30) DEFAULT 'APP_GD1_V1'::character varying NOT NULL,
    co_kho_tho_kho_khe_nghen_hong boolean NOT NULL,
    co_chong_mat_tuc_nguc_sap_ngat boolean NOT NULL,
    co_sung_moi_luoi_co_hong boolean NOT NULL,
    co_dau_bung_non_lien_tuc boolean NOT NULL,
    co_nguy_co_phan_ve boolean GENERATED ALWAYS AS ((co_kho_tho_kho_khe_nghen_hong OR co_chong_mat_tuc_nguc_sap_ngat OR co_sung_moi_luoi_co_hong OR co_dau_bung_non_lien_tuc)) STORED,
    ket_qua_dieu_huong character varying(30) GENERATED ALWAYS AS (
CASE
    WHEN (co_kho_tho_kho_khe_nghen_hong OR co_chong_mat_tuc_nguc_sap_ngat OR co_sung_moi_luoi_co_hong OR co_dau_bung_non_lien_tuc) THEN 'NGUY_CO_PHAN_VE'::text
    ELSE 'CHUYEN_BUOC_1'::text
END) STORED,
    xac_nhan_muon_goi_cap_cuu boolean,
    da_nhan_nut_goi_cap_cuu boolean DEFAULT false NOT NULL,
    so_dien_thoai_cap_cuu character varying(20),
    thoi_diem_nhan_nut_goi timestamp with time zone,
    thoi_diem_bat_dau timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_hoan_tat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_sanglocbaodongdo_goi_cap_cuu CHECK (((da_nhan_nut_goi_cap_cuu AND co_nguy_co_phan_ve AND (xac_nhan_muon_goi_cap_cuu IS TRUE) AND (thoi_diem_nhan_nut_goi IS NOT NULL) AND (so_dien_thoai_cap_cuu IS NOT NULL) AND (btrim((so_dien_thoai_cap_cuu)::text) <> ''::text)) OR ((NOT da_nhan_nut_goi_cap_cuu) AND (thoi_diem_nhan_nut_goi IS NULL) AND (so_dien_thoai_cap_cuu IS NULL)))),
    CONSTRAINT ck_sanglocbaodongdo_phien_ban CHECK ((btrim((phien_ban_bo_cau_hoi)::text) <> ''::text)),
    CONSTRAINT ck_sanglocbaodongdo_thoi_gian CHECK ((thoi_diem_hoan_tat >= thoi_diem_bat_dau)),
    CONSTRAINT ck_sanglocbaodongdo_xac_nhan CHECK (((co_nguy_co_phan_ve AND (xac_nhan_muon_goi_cap_cuu IS NOT NULL)) OR ((NOT co_nguy_co_phan_ve) AND (xac_nhan_muon_goi_cap_cuu IS NULL))))
);


--
-- Name: TABLE sanglocbaodongdo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sanglocbaodongdo IS 'Mỗi dòng là một lượt sàng lọc báo động đỏ đã hoàn tất trước đăng nhập hoặc trước bước định danh.';


--
-- Name: COLUMN sanglocbaodongdo.ma_phien_ung_dung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sanglocbaodongdo.ma_phien_ung_dung IS 'Mã UUID duy nhất để ứng dụng gửi lại an toàn khi retry cùng một lượt sàng lọc.';


--
-- Name: COLUMN sanglocbaodongdo.co_kho_tho_kho_khe_nghen_hong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sanglocbaodongdo.co_kho_tho_kho_khe_nghen_hong IS 'Khó thở, thở khò khè hoặc cảm giác nghẹn họng.';


--
-- Name: COLUMN sanglocbaodongdo.co_chong_mat_tuc_nguc_sap_ngat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sanglocbaodongdo.co_chong_mat_tuc_nguc_sap_ngat IS 'Chóng mặt, xây xẩm mặt mày, tức ngực hoặc cảm thấy sắp ngất.';


--
-- Name: COLUMN sanglocbaodongdo.co_sung_moi_luoi_co_hong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sanglocbaodongdo.co_sung_moi_luoi_co_hong IS 'Sưng nề nhanh ở môi, lưỡi hoặc cổ họng.';


--
-- Name: COLUMN sanglocbaodongdo.co_dau_bung_non_lien_tuc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sanglocbaodongdo.co_dau_bung_non_lien_tuc IS 'Đau bụng quặn hoặc nôn mửa liên tục.';


--
-- Name: COLUMN sanglocbaodongdo.da_nhan_nut_goi_cap_cuu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sanglocbaodongdo.da_nhan_nut_goi_cap_cuu IS 'Chỉ ghi nhận thao tác yêu cầu mở cuộc gọi; không khẳng định cuộc gọi đã kết nối.';


--
-- Name: sanglocbaodongdo_ma_luot_sang_loc_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sanglocbaodongdo ALTER COLUMN ma_luot_sang_loc ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sanglocbaodongdo_ma_luot_sang_loc_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: taikhoan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taikhoan (
    ma_tai_khoan bigint NOT NULL,
    ma_nguoi bigint NOT NULL,
    ma_vai_tro bigint NOT NULL,
    ten_dang_nhap character varying(100) NOT NULL,
    mat_khau_ma_hoa text NOT NULL,
    trang_thai_hoat_dong boolean DEFAULT true NOT NULL,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_tai_khoan_mat_khau CHECK ((btrim(mat_khau_ma_hoa) <> ''::text)),
    CONSTRAINT ck_tai_khoan_ten CHECK (((btrim((ten_dang_nhap)::text) <> ''::text) AND ((ten_dang_nhap)::text = btrim((ten_dang_nhap)::text)))),
    CONSTRAINT ck_tai_khoan_thoi_gian CHECK ((thoi_diem_cap_nhat >= thoi_diem_tao))
);


--
-- Name: TABLE taikhoan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.taikhoan IS 'Tài khoản đăng nhập; mỗi người tối đa một tài khoản.';


--
-- Name: COLUMN taikhoan.mat_khau_ma_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.taikhoan.mat_khau_ma_hoa IS 'Lưu password hash, không lưu mật khẩu rõ.';


--
-- Name: taikhoan_ma_tai_khoan_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.taikhoan ALTER COLUMN ma_tai_khoan ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.taikhoan_ma_tai_khoan_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tepdinhkem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tepdinhkem (
    ma_tep_dinh_kem bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    ma_tai_khoan bigint,
    ten_tep_goc character varying(255) NOT NULL,
    duong_dan_luu_tru character varying(500) NOT NULL,
    duong_dan_url character varying(500),
    dinh_dang_tep character varying(50),
    loai_phuong_tien character varying(50),
    dung_luong_byte bigint,
    phan_loai_muc_dich character varying(100),
    mo_ta_tep text,
    diem_do_mo numeric(6,2),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_tep_dung_luong CHECK ((dung_luong_byte > 0)),
    CONSTRAINT ck_tep_duong_dan CHECK ((btrim((duong_dan_luu_tru)::text) <> ''::text)),
    CONSTRAINT ck_tep_ten_goc CHECK ((btrim((ten_tep_goc)::text) <> ''::text))
);


--
-- Name: TABLE tepdinhkem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tepdinhkem IS 'Tệp đính kèm (ảnh, tài liệu) theo hồ sơ.';


--
-- Name: tepdinhkem_ma_tep_dinh_kem_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tepdinhkem ALTER COLUMN ma_tep_dinh_kem ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tepdinhkem_ma_tep_dinh_kem_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: thuoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thuoc (
    ma_thuoc character varying(50) NOT NULL,
    ten_thuoc character varying(255) NOT NULL,
    hoat_chat character varying(255),
    nhom_dieu_tri character varying(100),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_thuoc_nhom_dieu_tri CHECK (((nhom_dieu_tri IS NULL) OR ((nhom_dieu_tri)::text = ANY ((ARRAY['Khang histamine H1 TH2'::character varying, 'Sinh hoc/dich'::character varying, 'Uc che mien dich'::character varying, 'Corticosteroid toan than'::character varying, 'Khac'::character varying])::text[])))),
    CONSTRAINT ck_thuoc_ten CHECK ((btrim((ten_thuoc)::text) <> ''::text))
);


--
-- Name: TABLE thuoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thuoc IS 'Danh mục thuốc điều trị.';


--
-- Name: tiensubanthan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tiensubanthan (
    ma_tien_su_ban_than bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    tien_su_co_dia boolean,
    tien_su_co_dia_ghi_ro text,
    tien_su_tuyen_giap boolean,
    tien_su_tuyen_giap_ghi_ro text,
    tien_su_tu_mien boolean,
    tien_su_tu_mien_ghi_ro text,
    tien_su_di_ung boolean,
    tien_su_di_ung_ghi_ro text,
    tien_su_phan_ve boolean,
    tien_su_phan_ve_ghi_ro text,
    tien_su_viem_nhiem_man boolean,
    tien_su_viem_nhiem_man_ghi_ro text,
    tien_su_benh_khac boolean,
    tien_su_benh_khac_ghi_ro text,
    CONSTRAINT ck_detail_tien_su_benh_khac CHECK ((((tien_su_benh_khac IS TRUE) AND (tien_su_benh_khac_ghi_ro IS NOT NULL) AND (btrim(tien_su_benh_khac_ghi_ro) <> ''::text)) OR ((NOT (tien_su_benh_khac IS TRUE)) AND (tien_su_benh_khac_ghi_ro IS NULL)))),
    CONSTRAINT ck_detail_tien_su_co_dia CHECK ((((tien_su_co_dia IS TRUE) AND (tien_su_co_dia_ghi_ro IS NOT NULL) AND (btrim(tien_su_co_dia_ghi_ro) <> ''::text)) OR ((NOT (tien_su_co_dia IS TRUE)) AND (tien_su_co_dia_ghi_ro IS NULL)))),
    CONSTRAINT ck_detail_tien_su_di_ung CHECK ((((tien_su_di_ung IS TRUE) AND (tien_su_di_ung_ghi_ro IS NOT NULL) AND (btrim(tien_su_di_ung_ghi_ro) <> ''::text)) OR ((NOT (tien_su_di_ung IS TRUE)) AND (tien_su_di_ung_ghi_ro IS NULL)))),
    CONSTRAINT ck_detail_tien_su_phan_ve CHECK ((((tien_su_phan_ve IS TRUE) AND (tien_su_phan_ve_ghi_ro IS NOT NULL) AND (btrim(tien_su_phan_ve_ghi_ro) <> ''::text)) OR ((NOT (tien_su_phan_ve IS TRUE)) AND (tien_su_phan_ve_ghi_ro IS NULL)))),
    CONSTRAINT ck_detail_tien_su_tu_mien CHECK ((((tien_su_tu_mien IS TRUE) AND (tien_su_tu_mien_ghi_ro IS NOT NULL) AND (btrim(tien_su_tu_mien_ghi_ro) <> ''::text)) OR ((NOT (tien_su_tu_mien IS TRUE)) AND (tien_su_tu_mien_ghi_ro IS NULL)))),
    CONSTRAINT ck_detail_tien_su_tuyen_giap CHECK ((((tien_su_tuyen_giap IS TRUE) AND (tien_su_tuyen_giap_ghi_ro IS NOT NULL) AND (btrim(tien_su_tuyen_giap_ghi_ro) <> ''::text)) OR ((NOT (tien_su_tuyen_giap IS TRUE)) AND (tien_su_tuyen_giap_ghi_ro IS NULL)))),
    CONSTRAINT ck_detail_tien_su_viem_nhiem_man CHECK ((((tien_su_viem_nhiem_man IS TRUE) AND (tien_su_viem_nhiem_man_ghi_ro IS NOT NULL) AND (btrim(tien_su_viem_nhiem_man_ghi_ro) <> ''::text)) OR ((NOT (tien_su_viem_nhiem_man IS TRUE)) AND (tien_su_viem_nhiem_man_ghi_ro IS NULL)))),
    CONSTRAINT ck_tsbt_benh_khac_ghi_ro CHECK ((btrim(tien_su_benh_khac_ghi_ro) <> ''::text)),
    CONSTRAINT ck_tsbt_co_dia_ghi_ro CHECK ((btrim(tien_su_co_dia_ghi_ro) <> ''::text)),
    CONSTRAINT ck_tsbt_di_ung_ghi_ro CHECK ((btrim(tien_su_di_ung_ghi_ro) <> ''::text)),
    CONSTRAINT ck_tsbt_phan_ve_ghi_ro CHECK ((btrim(tien_su_phan_ve_ghi_ro) <> ''::text)),
    CONSTRAINT ck_tsbt_tu_mien_ghi_ro CHECK ((btrim(tien_su_tu_mien_ghi_ro) <> ''::text)),
    CONSTRAINT ck_tsbt_tuyen_giap_ghi_ro CHECK ((btrim(tien_su_tuyen_giap_ghi_ro) <> ''::text)),
    CONSTRAINT ck_tsbt_viem_nhiem_man_ghi_ro CHECK ((btrim(tien_su_viem_nhiem_man_ghi_ro) <> ''::text))
);


--
-- Name: TABLE tiensubanthan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tiensubanthan IS 'Tiền sử bản thân ghi nhận theo hồ sơ bệnh án.';


--
-- Name: tiensubanthan_ma_tien_su_ban_than_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tiensubanthan ALTER COLUMN ma_tien_su_ban_than ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tiensubanthan_ma_tien_su_ban_than_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tinhtrangnhiemtrung; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tinhtrangnhiemtrung (
    ma_tinh_trang_nhiem_trung bigint NOT NULL,
    ma_ho_so bigint NOT NULL,
    ho_hap_ho boolean,
    ho_hap_dau_hong boolean,
    ho_hap_hat_hoi boolean,
    ho_hap_so_mui boolean,
    ho_hap_thoi_gian numeric,
    ho_hap_khoang_cach numeric,
    tiet_nieu_tieu_rat boolean,
    tiet_nieu_tieu_buot boolean,
    tiet_nieu_thoi_gian numeric,
    tiet_nieu_khoang_cach numeric,
    da_mun boolean,
    da_nhot boolean,
    da_thoi_gian numeric,
    da_khoang_cach numeric,
    khac_ghi_ro text,
    khac_thoi_gian numeric,
    khac_khoang_cach numeric,
    CONSTRAINT ck_nhiem_trung_da_khoang_cach CHECK (((da_khoang_cach >= (0)::numeric) AND (da_khoang_cach < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_da_thoi_gian CHECK (((da_thoi_gian >= (0)::numeric) AND (da_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_ho_hap_khoang_cach CHECK (((ho_hap_khoang_cach >= (0)::numeric) AND (ho_hap_khoang_cach < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_ho_hap_thoi_gian CHECK (((ho_hap_thoi_gian >= (0)::numeric) AND (ho_hap_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_khac_ghi_ro CHECK ((btrim(khac_ghi_ro) <> ''::text)),
    CONSTRAINT ck_nhiem_trung_khac_khoang_cach CHECK (((khac_khoang_cach >= (0)::numeric) AND (khac_khoang_cach < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_khac_thoi_gian CHECK (((khac_thoi_gian >= (0)::numeric) AND (khac_thoi_gian < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_tiet_nieu_khoang_cach CHECK (((tiet_nieu_khoang_cach >= (0)::numeric) AND (tiet_nieu_khoang_cach < 'Infinity'::numeric))),
    CONSTRAINT ck_nhiem_trung_tiet_nieu_thoi_gian CHECK (((tiet_nieu_thoi_gian >= (0)::numeric) AND (tiet_nieu_thoi_gian < 'Infinity'::numeric)))
);


--
-- Name: TABLE tinhtrangnhiemtrung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tinhtrangnhiemtrung IS 'Tình trạng nhiễm trùng ghi nhận trong bệnh án cấp.';


--
-- Name: tinhtrangnhiemtrung_ma_tinh_trang_nhiem_trung_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tinhtrangnhiemtrung ALTER COLUMN ma_tinh_trang_nhiem_trung ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tinhtrangnhiemtrung_ma_tinh_trang_nhiem_trung_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_chukytheodoiuas7; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_chukytheodoiuas7 AS
 SELECT ma_chu_ky,
    ma_benh_nhan,
    ngay_bat_dau,
    ngay_ket_thuc,
    trang_thai_chu_ky,
    thoi_diem_tao,
    thoi_diem_cap_nhat,
    ( SELECT (count(*))::smallint AS count
           FROM public.nhatkyuashangngay n
          WHERE ((n.ma_chu_ky = c.ma_chu_ky) AND ((n.trang_thai_ngay)::text = 'HOP_LE'::text))) AS so_ngay_hop_le
   FROM public.chukytheodoiuas7 c;


--
-- Name: VIEW v_chukytheodoiuas7; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_chukytheodoiuas7 IS 'Đọc chu kỳ kèm số ngày HOP_LE tính trực tiếp từ nhật ký. Không ghi so_ngay_hop_le vào bảng chu kỳ.';


--
-- Name: vaitro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vaitro (
    ma_vai_tro bigint NOT NULL,
    ten_vai_tro character varying(50) NOT NULL,
    ten_hien_thi character varying(100) NOT NULL,
    mo_ta_vai_tro text,
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_vai_tro_hien_thi CHECK ((btrim((ten_hien_thi)::text) <> ''::text)),
    CONSTRAINT ck_vai_tro_ten CHECK ((btrim((ten_vai_tro)::text) <> ''::text)),
    CONSTRAINT ck_vai_tro_thoi_gian CHECK ((thoi_diem_cap_nhat >= thoi_diem_tao))
);


--
-- Name: TABLE vaitro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vaitro IS 'Vai trò hệ thống (Admin, Bác sĩ, ...).';


--
-- Name: vaitro_ma_vai_tro_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vaitro ALTER COLUMN ma_vai_tro ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vaitro_ma_vai_tro_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vaitroquyenhan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vaitroquyenhan (
    ma_vai_tro bigint NOT NULL,
    ma_quyen_han bigint NOT NULL,
    thoi_diem_gan timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ma_nguoi_gan bigint
);


--
-- Name: TABLE vaitroquyenhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vaitroquyenhan IS 'Thực thể kết hợp N:M giữa VaiTro và QuyenHan.';


--
-- Name: COLUMN vaitroquyenhan.ma_nguoi_gan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vaitroquyenhan.ma_nguoi_gan IS 'Tham chiếu Nguoi; NULL khi hệ thống khởi tạo.';


--
-- Name: vitritonthuong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitritonthuong (
    ma_vi_tri_ton_thuong bigint NOT NULL,
    ma_dot_ton_thuong_da bigint NOT NULL,
    vi_tri_co_the character varying(255),
    thoi_diem_xuat_hien timestamp with time zone,
    ten_thuoc_lien_quan character varying(255),
    thoi_gian_dung_thuoc_truoc_khi_xuat_hien character varying(100),
    hoan_canh_xuat_hien character varying(255),
    hoan_canh_xuat_hien_khac text,
    don_vi_thoi_gian character varying(50),
    thoi_diem_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thoi_diem_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_vitritonthuong_hoancanh CHECK ((((NOT ((hoan_canh_xuat_hien)::text IS DISTINCT FROM 'Khac'::text)) AND (hoan_canh_xuat_hien_khac IS NOT NULL) AND (btrim(hoan_canh_xuat_hien_khac) <> ''::text)) OR ((NOT (NOT ((hoan_canh_xuat_hien)::text IS DISTINCT FROM 'Khac'::text))) AND (hoan_canh_xuat_hien_khac IS NULL))))
);


--
-- Name: TABLE vitritonthuong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vitritonthuong IS 'Vị trí tổn thương trên cơ thể theo đợt.';


--
-- Name: vitritonthuong_ma_vi_tri_ton_thuong_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vitritonthuong ALTER COLUMN ma_vi_tri_ton_thuong ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vitritonthuong_ma_vi_tri_ton_thuong_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: anhchuptonthuong; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.anhchuptonthuong (ma_anh, ma_tep_dinh_kem, ma_dot_ton_thuong_da, ma_vi_tri_ton_thuong, thoi_diem_chup, moc_tien_trien, diem_ngua_nrs, diem_dau_nrs, diem_bong_rat_nrs, so_luong_not_san, chi_so_auas_cuc_bo, url_anh, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: benhanmaydaycap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.benhanmaydaycap (ma_ho_so, nhap_vien, cd_soc_phan_ve, cd_phan_ve, cd_may_day_cap_nang, cd_may_day_cap_thong_thuong, tien_su_benh_nen_da, tien_su_benh_nen_ho_hap, tien_su_benh_nen_tuan_hoan, tien_su_benh_tim_mach_ghi_ro, tien_su_benh_tieu_hoa_man_tinh_ghi_ro, tien_su_benh_nen_tieu_hoa, nhom_yeu_to_nghi_ngo, co_nghi_ngo_dot_nay, ten_yeu_to_nghi_ngo, loai_tien_su, da_tung_phan_ung_truoc_day, thoi_gian_tiep_xuc_den_khoi_phat, thoi_gian_keo_dai_tb, dot_gan_nhat_cach, tien_su_phan_ve_ghi_ro, tien_su_di_ung_ghi_ro, da_dieu_tri_benh_dot_nay, tuoi_lan_dau_bi_benh, so_lan_may_day_cap_truoc, thoi_diem_cap_nhat, benh_phu) FROM stdin;
\.


--
-- Data for Name: benhanmaydayman; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.benhanmaydayman (ma_ho_so, chan_doan_chinh, phan_nhom_csu, chung_da_ve_noi, may_day_cholinergic, may_day_do_lanh, may_day_adrenergic, may_day_do_nuoc, may_day_do_anh_sang, may_day_cam_ung_khac, may_day_cam_ung_khac_ghi_ro, bieu_hien_qua_trinh_benh) FROM stdin;
\.


--
-- Data for Name: benhnhan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.benhnhan (ma_benh_nhan, ma_his, nghe_nghiep, dan_toc, bhyt_so_the, bhyt_gia_tri_den, nguoi_nha_ho_ten_dia_chi, nguoi_nha_so_dien_thoai) FROM stdin;
2	\N	Khac	Kinh	DN4010888888888	\N	\N	\N
\.


--
-- Data for Name: benhsucacdotbenhtruoc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.benhsucacdotbenhtruoc (ma_tien_su, ma_ho_so, tung_co_dot_tuong_tu, tuoi_khoi_phat, so_dot_truoc, kieu_dien_bien, bieu_hien_dot_truoc, da_tung_nhap_vien, so_lan_nhap_vien, thoi_gian_tu_dot_gan_nhat, dien_bien_cac_dot_truoc) FROM stdin;
\.


--
-- Data for Name: chidanngungthuoc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chidanngungthuoc (ma_chi_dan_ngung, ma_don_thuoc, thuoc_can_ngung, ngung_tu_ngay, thoi_gian_ngung_ngay, muc_dich, muc_dich_khac_ghi_ro) FROM stdin;
\.


--
-- Data for Name: chinhanh; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chinhanh (ma_chi_nhanh, ten_chi_nhanh, dia_chi, so_dien_thoai, trang_thai) FROM stdin;
1	Phòng khám Đa khoa DrMayDay - Cơ sở chính	123 Đường Giải Phóng, Hà Nội	02438888888	t
\.


--
-- Data for Name: chitietdonthuoc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chitietdonthuoc (ma_chi_tiet_don_thuoc, ma_don_thuoc, ma_thuoc, ten_thuoc_bo_sung, lieu_dung, thoi_gian_dung, ma_ke_hoach_dieu_tri, thoi_diem_tao) FROM stdin;
\.


--
-- Data for Name: chitietketquanghiemphap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chitietketquanghiemphap (ma_chi_tiet_ket_qua_nghiem_phap, ma_phien_nghiem_phap, loai_nghiem_phap, ket_qua, nguong_gia_tri_so, nguong_gia_tri_chu, don_vi_do, diem_ngua_nrs, diem_bong_rat_nrs, diem_dau_nrs, can_nguyen_khac_ten, la_can_nguyen_khac) FROM stdin;
\.


--
-- Data for Name: chitiettonthuongcaptinh; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chitiettonthuongcaptinh (ma_chi_tiet_ton_thuong_cap_tinh, ma_phien_kham, dang_ton_thuong, dang_ton_thuong_khac, kich_thuoc_max_mm, kich_thuoc_min_mm, kich_thuoc_dong_deu_mm, loai_kich_thuoc, thoi_gian_ton_tai_tb, dien_bien, so_luong_san_phu, phu_mach_ben, vi_tri, vi_tri_dac_biet_ghi_ro) FROM stdin;
\.


--
-- Data for Name: chitiettonthuongsanphu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chitiettonthuongsanphu (ma_chi_tiet_ton_thuong, ma_phien_kham, dang_ton_thuong, kich_thuoc, thoi_gian_ton_tai, thoi_diem, tinh_trang_dung_thuoc, ma_dac_diem_san_phu, so_luong, vi_tri) FROM stdin;
\.


--
-- Data for Name: chukytheodoiuas7; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chukytheodoiuas7 (ma_chu_ky, ma_benh_nhan, ngay_bat_dau, ngay_ket_thuc, trang_thai_chu_ky, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: dacdiemsanphu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dacdiemsanphu (ma_dac_diem_san_phu, ten_dac_diem, mo_ta) FROM stdin;
\.


--
-- Data for Name: danhgiamucdohoatdongbenh; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.danhgiamucdohoatdongbenh (ma_danh_gia_hoat_dong, ma_phien_kham_man, du_du_lieu_7_ngay, ma_nguoi_danh_gia, thoi_diem_danh_gia, hss7_san_phu_khong_dung_thuoc, hss7_san_phu_dung_thuoc_deu, hss7_san_phu_dung_thuoc_khong_deu, iss7_ngua_khong_dung_thuoc, iss7_ngua_dung_thuoc_deu, iss7_ngua_dung_thuoc_khong_deu, uas7_tong_khong_dung_thuoc, uas7_tong_dung_thuoc_deu, uas7_tong_dung_thuoc_khong_deu, ghi_chu) FROM stdin;
\.


--
-- Data for Name: dauhieusinhton; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dauhieusinhton (ma_dau_hieu_sinh_ton, ma_phien_kham, ma_bac_si, thoi_diem, tri_giac, nhiet_do, spo2, mach, huyet_ap_tam_thu, huyet_ap_tam_truong, nhip_tho, bat_thuong_co_quan_khac, bat_thuong_co_quan_khac_ghi_ro, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: donthuoc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.donthuoc (ma_don_thuoc, ma_ho_so, ngay_ke_don, trang_thai_don, ghi_chu_dieu_tri, ngung_thuoc_lan_sau, thuoc_can_ngung_truoc_tai_kham, thoi_diem_tao, thoi_diem_cap_nhat, ma_phien_kham) FROM stdin;
\.


--
-- Data for Name: dottonthuongda; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dottonthuongda (ma_dot_ton_thuong_da, ma_benh_nhan, ma_ho_so_man, ten_dot_ton_thuong_da, thoi_diem_xuat_hien, hoan_canh_xuat_hien, hoan_canh_xuat_hien_khac, ten_thuoc_dung_gan_thoi_diem_xuat_hien, thoi_gian_dung_thuoc_truoc_khi_xuat_hien, don_vi_thoi_gian, chi_tiet_dot_ton_thuong, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: hoancanhkhoiphatdiung; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hoancanhkhoiphatdiung (ma_hoan_canh_khoi_phat, ma_ho_so, thuc_an_nghi_ngo, thuc_an_thoi_gian, thuc_an_tung_bi, thuc_an_loai_tien_su, thuc_an_tien_su_ghi_ro, thuoc_nghi_ngo, thuoc_thoi_gian, thuoc_tung_bi, thuoc_loai_tien_su, thuoc_tien_su_ghi_ro, con_trung_nghi_ngo, con_trung_thoi_gian, con_trung_tung_bi, con_trung_loai_tien_su, con_trung_tien_su_ghi_ro, khac_nghi_ngo, khac_thoi_gian, khac_tung_bi, khac_loai_tien_su, khac_tien_su_ghi_ro) FROM stdin;
\.


--
-- Data for Name: hosobenhan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hosobenhan (ma_ho_so, ma_benh_nhan, loai_benh_an, thoi_diem_kham_lan_dau, ngay_bat_dau_dieu_tri_ngoai_tru, ngay_ket_thuc_dieu_tri_ngoai_tru, chan_doan_tuyen_truoc, chan_doan_ban_dau_phong_kham, ket_qua_dieu_tri_bao_hiem, thoi_gian_khoi_phat_tuan, trang_thai, tien_su_gia_dinh, tien_su_gia_dinh_ghi_ro, da_dieu_tri_truoc_kham) FROM stdin;
\.


--
-- Data for Name: ketquacanlamsang; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ketquacanlamsang (ma_ket_qua_can_lam_sang, ma_phien_kham, loai_ket_qua_can_lam_sang, wbc, crp, ige_toan_phan, can_lam_sang_khac_ghi_chu, xet_nghiem_khac, thoi_diem_thuc_hien, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: ketquacanlamsangcap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ketquacanlamsangcap (ma_ket_qua_can_lam_sang, lym, neu, plt, tryptase_cap, tryptase_nen) FROM stdin;
\.


--
-- Data for Name: ketquacanlamsangman; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ketquacanlamsangman (ma_ket_qua_can_lam_sang, test_huyet_thanh_tu_than, ige_khang_tpo_ket_qua, bat_ket_qua, ige_khang_il24_ket_qua, asst_duong_kinh_mm, eo, ba_bach_cau, anti_tpo, tsh, ft4, ft3, mau_lang_2h, mau_lang_1h, ana_hep2, sieu_am_tuyen_giap) FROM stdin;
\.


--
-- Data for Name: ketquaproms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ketquaproms (ma_ket_qua_proms, ma_phien_kham_man, uct_diem, aect_diem, act_diem_legacy, dlqi_diem, cu_q2ol_diem, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: khoaphong; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.khoaphong (ma_khoa_phong, ten_khoa_phong, loai_khoa, mo_ta, ma_chi_nhanh) FROM stdin;
\.


--
-- Data for Name: loainghiemphap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loainghiemphap (ma_nghiem_phap, ten_nghiem_phap, phuong_phap_thuc_hien, thoi_gian_chuan, thoi_diem_tao, thoi_diem_cap_nhat, la_can_nguyen_khac) FROM stdin;
1	Da vẽ nổi	FricTest	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
2	Mày đay cholinergic	Xe đạp lực kế	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
3	Mày đay do nóng	TempTest	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
4	Mày đay do lạnh - TempTest	TempTest	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
5	Mày đay do lạnh - cục đá	Test cục đá	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
6	Mày đay áp lực chậm	Treo tạ	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
7	Mày đay do ánh sáng	UVA/UVB	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
8	Mày đay do nước	Khăn ướt 35–37°C	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00	f
9	Căn nguyên khác	Ghi rõ tên test/phương pháp trong can_nguyen_khac_ten	\N	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:53.22657+00	t
\.


--
-- Data for Name: nguoi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nguoi (ma_nguoi, ho_ten, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi_tinh_tp, dia_chi_xa_phuong, dia_chi_so_nha_thon_pho, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
3	Bác Sĩ Test Postgres (Đã Sửa)	\N	\N	0988776655	\N	\N	\N	2026-10-13 10:11:44.255416+00	2026-10-13 10:11:45.25645+00
4	Bác Sĩ Test Postgres (Đã Sửa)	\N	\N	0986474237	\N	\N	\N	2026-10-13 10:14:34.339804+00	2026-10-13 10:14:35.42354+00
5	Bác Sĩ Test Postgres (Đã Sửa)	\N	\N	0986717851	\N	\N	\N	2026-10-13 10:18:37.935809+00	2026-10-13 10:18:38.898423+00
6	Người Dùng Test Token	\N	\N	0977554120	\N	\N	\N	2026-10-20 06:25:54.382519+00	2026-10-20 06:25:54.382519+00
7	Người Dùng Test Token	\N	\N	0977901888	\N	\N	\N	2026-10-20 06:31:42.48224+00	2026-10-20 06:31:42.48224+00
8	Người Dùng Test Token	\N	\N	0978183065	\N	\N	\N	2026-10-20 06:36:23.41916+00	2026-10-20 06:36:23.41916+00
9	Người Dùng Test Token	\N	\N	0978374974	\N	\N	\N	2026-10-20 06:39:35.457412+00	2026-10-20 06:39:35.457412+00
11	Người Dùng Đã Sửa Tên	\N	\N	0979334880	\N	\N	\N	2026-10-20 06:55:25.264282+00	2026-10-20 06:55:34.19998+00
12	Người Dùng Đã Sửa Tên	\N	\N	0979415947	\N	\N	\N	2026-10-20 06:56:46.297128+00	2026-10-20 06:56:53.893997+00
13	Bác sĩ Nguyễn Văn C	\N	\N	0988776656	\N	\N	\N	2026-10-20 07:18:25.379049+00	2026-10-20 07:18:25.379049+00
1	Quản Trị Viên Hệ Thống Mới	\N	\N	0900000001	\N	\N	\N	2026-10-13 09:57:19.518856+00	2026-10-20 07:20:39.301435+00
18	Người Dùng Số Quốc Tế	\N	\N	0969391694	\N	\N	\N	2026-11-05 00:43:01.963647+00	2026-11-05 00:43:01.963647+00
2	Nguyễn Văn Bệnh Nhân E2E	1993-01-01	Nam	0912345678	\N	\N	Tòa nhà FPT, Cầu Giấy, Hà Nội	2026-10-13 10:06:30.94616+00	2026-11-05 00:43:12.410283+00
19	Người Dùng Đã Sửa Tên	\N	\N	0979392979	\N	\N	\N	2026-11-05 00:43:03.055672+00	2026-11-05 00:43:13.092863+00
\.


--
-- Data for Name: nhanvien; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nhanvien (ma_nhan_vien, ma_chi_nhanh) FROM stdin;
1	1
3	1
4	1
5	1
6	1
7	1
8	1
9	1
11	1
12	1
13	1
18	1
19	1
\.


--
-- Data for Name: nhatkyaashangngay; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nhatkyaashangngay (ma_nhat_ky_aas, ma_benh_nhan, ma_ho_so_man, ngay_theo_doi, co_dot_sung_phu, thoi_diem_xuat_hien, muc_kho_chiu, han_che_hoat_dong, anh_huong_ngoai_hinh, do_nang_tong_the, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: nhatkyuashangngay; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nhatkyuashangngay (ma_nhat_ky_uas, ma_chu_ky, ma_ho_so_man, ma_benh_nhan, ngay_cham_diem, ngay_thu_may_trong_chu_ky, diem_san_phu_hss, diem_ngua_iss, trang_thai_dung_thuoc, trang_thai_ngay, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: phienkham; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phienkham (ma_phien_kham, ma_ho_so, ma_bac_si, ma_phong_kham, loai_benh_an, ngay_kham, lan_kham_thu, loai_phien_kham, luu_huyet_thanh, sot, sot_nhiet_do_c, ngay_hen_tai_kham, tom_tat_buoi_kham, huong_xu_tri_lan_sau, dan_do) FROM stdin;
\.


--
-- Data for Name: phienkhamcap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phienkhamcap (ma_phien_kham, trieu_chung_da, trieu_chung_ho_hap, so_voi_thuong_ngay_ho_hap, trieu_chung_tuan_hoan, so_voi_thuong_ngay_tuan_hoan, trieu_chung_tieu_hoa, so_voi_thuong_ngay_tieu_hoa, co_san_phu, co_anh_san_phu, so_lan_non) FROM stdin;
\.


--
-- Data for Name: phienkhamman; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phienkhamman (ma_phien_kham, hien_tai_co_san_phu, uu_the_ngau_nhien, vi_tri_san_phu, yeu_to_lam_nang_sa_phu, hoan_canh_xuat_hien_san_phu, trong_dot_co_phu_mach, hien_tai_co_phu_mach, so_lan_phu_mach_dot_nay, hoan_canh_xuat_hien_phu_mach, so_lan_phu_mach_nang_phai_nhap_vien, thoi_gian_ton_tai_phu_mach_co_dung_thuoc, thoi_gian_ton_tai_phu_mach_khong_dung_thuoc, diem_aas7, ben_phu_mach, thoi_gian_ngau_nhien_tuan, uu_the_kich_thich, thoi_gian_kich_thich_tuan, uu_the_tuong_duong, uu_the_khong_ro, thu_tu_xuat_hien_so_voi_san_phu, phu_mach_1_tuan_gan_day, chan_doan_tai_kham, khoang_cach_xuat_hien, phu_mi_mat, phu_luoi, phu_moi, phu_vung_mat_khac, phu_thanh_quan, phu_ban_chan, phu_sinh_duc, phu_vi_tri_khac, phu_vi_tri_khac_ghi_ro, phu_ban_tay) FROM stdin;
\.


--
-- Data for Name: phiennghiemphapkichthich; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phiennghiemphapkichthich (ma_phien_nghiem_phap, ma_phien_kham, ngung_khang_histamine, thoi_gian_ngung_histamine, ngung_corticoid, thoi_gian_ngung_corticoid, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: phongkham; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phongkham (ma_phong_kham, ten_phong_kham, ma_chi_nhanh) FROM stdin;
\.


--
-- Data for Name: quyenhan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quyenhan (ma_quyen_han, ten_quyen_han, nhom_quyen, mo_ta, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
3	manage_users	USER_MANAGEMENT	Quản lý người dùng hệ thống	2026-11-05 10:18:29.595226+00	2026-11-05 10:18:29.595226+00
4	manage_medical_records	CLINICAL	Quản lý hồ sơ bệnh án	2026-11-05 10:18:29.595226+00	2026-11-05 10:18:29.595226+00
5	view_reports	REPORT	Xem báo cáo thống kê	2026-11-05 10:18:29.595226+00	2026-11-05 10:18:29.595226+00
2	manage_clinical	CLINICAL	Quản lý lâm sàng	2026-11-05 10:19:09.544054+00	2026-11-05 10:19:09.544054+00
99	temp_to_delete	TEMP	Quyen de test API 20 delete	2026-11-05 10:56:07.80624+00	2026-11-05 10:56:07.80624+00
6	manage_users_v1	USER_MANAGEMENT	Quản lý người dùng hệ thống	2026-11-05 11:00:17.581283+00	2026-11-05 11:00:17.581283+00
1	manage_users_v2	USER_MANAGEMENT	Quản lý người dùng phiên bản 2	2026-11-05 10:53:22.172102+00	2026-11-05 11:01:21.502986+00
\.


--
-- Data for Name: sanglocbaodongdo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sanglocbaodongdo (ma_luot_sang_loc, ma_phien_ung_dung, ma_benh_nhan, phien_ban_bo_cau_hoi, co_kho_tho_kho_khe_nghen_hong, co_chong_mat_tuc_nguc_sap_ngat, co_sung_moi_luoi_co_hong, co_dau_bung_non_lien_tuc, xac_nhan_muon_goi_cap_cuu, da_nhan_nut_goi_cap_cuu, so_dien_thoai_cap_cuu, thoi_diem_nhan_nut_goi, thoi_diem_bat_dau, thoi_diem_hoan_tat, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: taikhoan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.taikhoan (ma_tai_khoan, ma_nguoi, ma_vai_tro, ten_dang_nhap, mat_khau_ma_hoa, trang_thai_hoat_dong, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
2	2	4	0912345678	$2a$10$LOYWnASDBxluWF4bephNXuWVdfJBHm.MCItwBw7qRsxT4eyJ4eB5q	t	2026-10-13 10:11:43.188801+00	2026-10-13 10:11:43.188801+00
3	3	3	0988776655	$2a$10$.zPj.jC0nnpPxKAfVbDBy.Ck80bHXt2tSn0PrprjYiSTjmvMClhE.	f	2026-10-13 10:11:44.366553+00	2026-10-13 10:11:45.286914+00
4	4	3	0986474237	$2a$10$vDBadf3hWl31Q8gLFCWBguDiSznQaVFe6fL291ZwX3yFwHtUTmYNm	f	2026-10-13 10:14:34.556929+00	2026-10-13 10:14:35.453226+00
5	5	3	0986717851	$2a$10$9jhLoA5id10V3FD5AvYug.0ABndR5KqtKKz4yp7oJhpbOYhPHs.nW	f	2026-10-13 10:18:38.063807+00	2026-10-13 10:18:38.92545+00
6	6	2	0977554120	$2a$10$/kHtlNqY68WQyeyV/Vgjp.F6xqLEyF1WOvE4jN7gmB1NSLsO5ujja	t	2026-10-20 06:25:54.824615+00	2026-10-20 06:25:54.824615+00
7	7	2	0977901888	$2a$10$fonPnUEoCe216gfF2/WhoOD.QYxzIoq6yai/zEUGYabQ5BJ1Ucuv2	t	2026-10-20 06:31:42.881738+00	2026-10-20 06:31:42.881738+00
8	8	2	0978183065	$2a$10$jezJfoZ3dyuzKoENHeSW8ONuC1WHxczAiwGPKcQN.0k2vuvHILK9.	t	2026-10-20 06:36:23.695033+00	2026-10-20 06:36:23.695033+00
9	9	2	0978374974	$2a$10$dASKVyjY/MKIUHgWHknE4eciyH/gP61Lv92CQEh0E2AJTiIRE5GFy	t	2026-10-20 06:39:35.818827+00	2026-10-20 06:39:35.818827+00
10	11	3	0979334880	$2a$10$0CZT1uerAiOq38dF5IMK5eRA9xjd/u.Shg5f3nIeu7g2g/Ta.SNlW	f	2026-10-20 06:55:25.264282+00	2026-10-20 06:55:34.455875+00
11	12	3	0979415947	$2a$10$Q4LSxqIQtC8nkewr.Fj0Te8ptHeowOr/XtC.wwcQmT8WmfrzEBkyG	f	2026-10-20 06:56:46.297128+00	2026-10-20 06:56:53.950882+00
12	13	2	0988776656	$2a$10$F7JXq/8MTG0fmC6wb9/o0et2tOOJJbSvdm0OAL56GUqHGm8FkdTD2	t	2026-10-20 07:18:25.379049+00	2026-10-20 07:18:25.379049+00
1	1	1	0900000001	$2a$10$Mx/QYa2lIVWw1JlYGdREIOL5Cy0Vydx2W2GG8qKAkEbV9Na1m5tZS	t	2026-10-13 10:06:30.82398+00	2026-10-20 07:20:39.376724+00
15	18	2	0969391694	$2a$10$Og5Dxt.Ts4BLQutedoka/uELNjaqKigUKh.QvtRthiAmOBhkC9VOq	t	2026-11-05 00:43:01.963647+00	2026-11-05 00:43:01.963647+00
16	19	3	0979392979	$2a$10$Lrxozu8nV7.MZX6j1g5RFeDcHU6i/tbQgpAx4z7WMa1S8zzxz96ja	f	2026-11-05 00:43:03.055672+00	2026-11-05 00:43:13.123911+00
\.


--
-- Data for Name: tepdinhkem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tepdinhkem (ma_tep_dinh_kem, ma_ho_so, ma_tai_khoan, ten_tep_goc, duong_dan_luu_tru, duong_dan_url, dinh_dang_tep, loai_phuong_tien, dung_luong_byte, phan_loai_muc_dich, mo_ta_tep, diem_do_mo, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: thuoc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.thuoc (ma_thuoc, ten_thuoc, hoat_chat, nhom_dieu_tri, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Data for Name: tiensubanthan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tiensubanthan (ma_tien_su_ban_than, ma_ho_so, tien_su_co_dia, tien_su_co_dia_ghi_ro, tien_su_tuyen_giap, tien_su_tuyen_giap_ghi_ro, tien_su_tu_mien, tien_su_tu_mien_ghi_ro, tien_su_di_ung, tien_su_di_ung_ghi_ro, tien_su_phan_ve, tien_su_phan_ve_ghi_ro, tien_su_viem_nhiem_man, tien_su_viem_nhiem_man_ghi_ro, tien_su_benh_khac, tien_su_benh_khac_ghi_ro) FROM stdin;
\.


--
-- Data for Name: tinhtrangnhiemtrung; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tinhtrangnhiemtrung (ma_tinh_trang_nhiem_trung, ma_ho_so, ho_hap_ho, ho_hap_dau_hong, ho_hap_hat_hoi, ho_hap_so_mui, ho_hap_thoi_gian, ho_hap_khoang_cach, tiet_nieu_tieu_rat, tiet_nieu_tieu_buot, tiet_nieu_thoi_gian, tiet_nieu_khoang_cach, da_mun, da_nhot, da_thoi_gian, da_khoang_cach, khac_ghi_ro, khac_thoi_gian, khac_khoang_cach) FROM stdin;
\.


--
-- Data for Name: vaitro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vaitro (ma_vai_tro, ten_vai_tro, ten_hien_thi, mo_ta_vai_tro, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
1	admin	Quản trị viên	Toàn quyền quản lý hệ thống	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00
2	bac_si	Bác sĩ	Khám bệnh, kê đơn, ghi nhận kết quả	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00
3	dieu_duong	Điều dưỡng	Hỗ trợ bác sĩ, ghi nhận dấu hiệu sinh tồn	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00
4	benh_nhan	Bệnh nhân	Xem hồ sơ, nhật ký theo dõi	2026-10-12 04:04:45.183276+00	2026-10-12 04:04:45.183276+00
\.


--
-- Data for Name: vaitroquyenhan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vaitroquyenhan (ma_vai_tro, ma_quyen_han, thoi_diem_gan, ma_nguoi_gan) FROM stdin;
1	1	2026-11-05 11:01:00.560178+00	\N
1	2	2026-11-05 11:01:00.598213+00	\N
\.


--
-- Data for Name: vitritonthuong; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vitritonthuong (ma_vi_tri_ton_thuong, ma_dot_ton_thuong_da, vi_tri_co_the, thoi_diem_xuat_hien, ten_thuoc_lien_quan, thoi_gian_dung_thuoc_truoc_khi_xuat_hien, hoan_canh_xuat_hien, hoan_canh_xuat_hien_khac, don_vi_thoi_gian, thoi_diem_tao, thoi_diem_cap_nhat) FROM stdin;
\.


--
-- Name: anhchuptonthuong_ma_anh_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.anhchuptonthuong_ma_anh_seq', 1, false);


--
-- Name: benhsucacdotbenhtruoc_ma_tien_su_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.benhsucacdotbenhtruoc_ma_tien_su_seq', 1, false);


--
-- Name: chidanngungthuoc_ma_chi_dan_ngung_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chidanngungthuoc_ma_chi_dan_ngung_seq', 1, false);


--
-- Name: chinhanh_ma_chi_nhanh_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chinhanh_ma_chi_nhanh_seq', 1, true);


--
-- Name: chitietdonthuoc_ma_chi_tiet_don_thuoc_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chitietdonthuoc_ma_chi_tiet_don_thuoc_seq', 1, false);


--
-- Name: chitietketquanghiemphap_ma_chi_tiet_ket_qua_nghiem_phap_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chitietketquanghiemphap_ma_chi_tiet_ket_qua_nghiem_phap_seq', 1, false);


--
-- Name: chitiettonthuongcaptinh_ma_chi_tiet_ton_thuong_cap_tinh_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chitiettonthuongcaptinh_ma_chi_tiet_ton_thuong_cap_tinh_seq', 1, false);


--
-- Name: chitiettonthuongsanphu_ma_chi_tiet_ton_thuong_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chitiettonthuongsanphu_ma_chi_tiet_ton_thuong_seq', 1, false);


--
-- Name: chukytheodoiuas7_ma_chu_ky_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chukytheodoiuas7_ma_chu_ky_seq', 1, false);


--
-- Name: dacdiemsanphu_ma_dac_diem_san_phu_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dacdiemsanphu_ma_dac_diem_san_phu_seq', 1, false);


--
-- Name: danhgiamucdohoatdongbenh_ma_danh_gia_hoat_dong_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.danhgiamucdohoatdongbenh_ma_danh_gia_hoat_dong_seq', 1, false);


--
-- Name: dauhieusinhton_ma_dau_hieu_sinh_ton_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dauhieusinhton_ma_dau_hieu_sinh_ton_seq', 1, false);


--
-- Name: donthuoc_ma_don_thuoc_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.donthuoc_ma_don_thuoc_seq', 1, false);


--
-- Name: dottonthuongda_ma_dot_ton_thuong_da_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dottonthuongda_ma_dot_ton_thuong_da_seq', 1, false);


--
-- Name: hoancanhkhoiphatdiung_ma_hoan_canh_khoi_phat_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hoancanhkhoiphatdiung_ma_hoan_canh_khoi_phat_seq', 1, false);


--
-- Name: hosobenhan_ma_ho_so_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hosobenhan_ma_ho_so_seq', 1, false);


--
-- Name: ketquacanlamsang_ma_ket_qua_can_lam_sang_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ketquacanlamsang_ma_ket_qua_can_lam_sang_seq', 1, false);


--
-- Name: ketquaproms_ma_ket_qua_proms_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ketquaproms_ma_ket_qua_proms_seq', 1, false);


--
-- Name: khoaphong_ma_khoa_phong_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.khoaphong_ma_khoa_phong_seq', 1, false);


--
-- Name: loainghiemphap_ma_nghiem_phap_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loainghiemphap_ma_nghiem_phap_seq', 9, true);


--
-- Name: nguoi_ma_nguoi_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nguoi_ma_nguoi_seq', 19, true);


--
-- Name: nhatkyaashangngay_ma_nhat_ky_aas_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nhatkyaashangngay_ma_nhat_ky_aas_seq', 1, false);


--
-- Name: nhatkyuashangngay_ma_nhat_ky_uas_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nhatkyuashangngay_ma_nhat_ky_uas_seq', 1, false);


--
-- Name: phienkham_ma_phien_kham_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.phienkham_ma_phien_kham_seq', 1, false);


--
-- Name: phiennghiemphapkichthich_ma_phien_nghiem_phap_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.phiennghiemphapkichthich_ma_phien_nghiem_phap_seq', 1, false);


--
-- Name: phongkham_ma_phong_kham_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.phongkham_ma_phong_kham_seq', 1, false);


--
-- Name: quyenhan_ma_quyen_han_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quyenhan_ma_quyen_han_seq', 6, true);


--
-- Name: sanglocbaodongdo_ma_luot_sang_loc_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sanglocbaodongdo_ma_luot_sang_loc_seq', 1, false);


--
-- Name: taikhoan_ma_tai_khoan_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taikhoan_ma_tai_khoan_seq', 16, true);


--
-- Name: tepdinhkem_ma_tep_dinh_kem_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tepdinhkem_ma_tep_dinh_kem_seq', 1, false);


--
-- Name: tiensubanthan_ma_tien_su_ban_than_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tiensubanthan_ma_tien_su_ban_than_seq', 1, false);


--
-- Name: tinhtrangnhiemtrung_ma_tinh_trang_nhiem_trung_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tinhtrangnhiemtrung_ma_tinh_trang_nhiem_trung_seq', 1, false);


--
-- Name: vaitro_ma_vai_tro_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vaitro_ma_vai_tro_seq', 4, true);


--
-- Name: vitritonthuong_ma_vi_tri_ton_thuong_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vitritonthuong_ma_vi_tri_ton_thuong_seq', 1, false);


--
-- Name: dacdiemsanphu dacdiemsanphu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dacdiemsanphu
    ADD CONSTRAINT dacdiemsanphu_pkey PRIMARY KEY (ma_dac_diem_san_phu);


--
-- Name: dacdiemsanphu dacdiemsanphu_ten_dac_diem_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dacdiemsanphu
    ADD CONSTRAINT dacdiemsanphu_ten_dac_diem_key UNIQUE (ten_dac_diem);


--
-- Name: phongkham phongkham_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phongkham
    ADD CONSTRAINT phongkham_pkey PRIMARY KEY (ma_phong_kham);


--
-- Name: anhchuptonthuong pk_anhchuptonthuong; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anhchuptonthuong
    ADD CONSTRAINT pk_anhchuptonthuong PRIMARY KEY (ma_anh);


--
-- Name: benhnhan pk_benh_nhan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhnhan
    ADD CONSTRAINT pk_benh_nhan PRIMARY KEY (ma_benh_nhan);


--
-- Name: benhanmaydaycap pk_benhanmaydaycap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhanmaydaycap
    ADD CONSTRAINT pk_benhanmaydaycap PRIMARY KEY (ma_ho_so);


--
-- Name: benhanmaydayman pk_benhanmaydayman; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhanmaydayman
    ADD CONSTRAINT pk_benhanmaydayman PRIMARY KEY (ma_ho_so);


--
-- Name: benhsucacdotbenhtruoc pk_benhsucacdotbenhtruoc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhsucacdotbenhtruoc
    ADD CONSTRAINT pk_benhsucacdotbenhtruoc PRIMARY KEY (ma_tien_su);


--
-- Name: chinhanh pk_chi_nhanh; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chinhanh
    ADD CONSTRAINT pk_chi_nhanh PRIMARY KEY (ma_chi_nhanh);


--
-- Name: chitietketquanghiemphap pk_chi_tiet_kqnp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietketquanghiemphap
    ADD CONSTRAINT pk_chi_tiet_kqnp PRIMARY KEY (ma_chi_tiet_ket_qua_nghiem_phap);


--
-- Name: chidanngungthuoc pk_chidanngungthuoc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chidanngungthuoc
    ADD CONSTRAINT pk_chidanngungthuoc PRIMARY KEY (ma_chi_dan_ngung);


--
-- Name: chitietdonthuoc pk_chitietdonthuoc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdonthuoc
    ADD CONSTRAINT pk_chitietdonthuoc PRIMARY KEY (ma_chi_tiet_don_thuoc);


--
-- Name: chitiettonthuongcaptinh pk_chitiettonthuongcaptinh; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiettonthuongcaptinh
    ADD CONSTRAINT pk_chitiettonthuongcaptinh PRIMARY KEY (ma_chi_tiet_ton_thuong_cap_tinh);


--
-- Name: chitiettonthuongsanphu pk_chitiettonthuongsanphu; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiettonthuongsanphu
    ADD CONSTRAINT pk_chitiettonthuongsanphu PRIMARY KEY (ma_chi_tiet_ton_thuong);


--
-- Name: chukytheodoiuas7 pk_chukytheodoiuas7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chukytheodoiuas7
    ADD CONSTRAINT pk_chukytheodoiuas7 PRIMARY KEY (ma_chu_ky);


--
-- Name: danhgiamucdohoatdongbenh pk_danhgiamucdohoatdongbenh; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgiamucdohoatdongbenh
    ADD CONSTRAINT pk_danhgiamucdohoatdongbenh PRIMARY KEY (ma_danh_gia_hoat_dong);


--
-- Name: dauhieusinhton pk_dauhieusinhton; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dauhieusinhton
    ADD CONSTRAINT pk_dauhieusinhton PRIMARY KEY (ma_dau_hieu_sinh_ton);


--
-- Name: donthuoc pk_donthuoc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donthuoc
    ADD CONSTRAINT pk_donthuoc PRIMARY KEY (ma_don_thuoc);


--
-- Name: dottonthuongda pk_dottonthuongda; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dottonthuongda
    ADD CONSTRAINT pk_dottonthuongda PRIMARY KEY (ma_dot_ton_thuong_da);


--
-- Name: hoancanhkhoiphatdiung pk_hoancanhkhoiphatdiung; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoancanhkhoiphatdiung
    ADD CONSTRAINT pk_hoancanhkhoiphatdiung PRIMARY KEY (ma_hoan_canh_khoi_phat);


--
-- Name: hosobenhan pk_hosobenhan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosobenhan
    ADD CONSTRAINT pk_hosobenhan PRIMARY KEY (ma_ho_so);


--
-- Name: ketquaproms pk_ketquaproms; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquaproms
    ADD CONSTRAINT pk_ketquaproms PRIMARY KEY (ma_ket_qua_proms);


--
-- Name: khoaphong pk_khoa_phong; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khoaphong
    ADD CONSTRAINT pk_khoa_phong PRIMARY KEY (ma_khoa_phong);


--
-- Name: ketquacanlamsang pk_kqcls; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsang
    ADD CONSTRAINT pk_kqcls PRIMARY KEY (ma_ket_qua_can_lam_sang);


--
-- Name: ketquacanlamsangcap pk_kqcls_cap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsangcap
    ADD CONSTRAINT pk_kqcls_cap PRIMARY KEY (ma_ket_qua_can_lam_sang);


--
-- Name: ketquacanlamsangman pk_kqcls_man; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsangman
    ADD CONSTRAINT pk_kqcls_man PRIMARY KEY (ma_ket_qua_can_lam_sang);


--
-- Name: loainghiemphap pk_loai_nghiem_phap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loainghiemphap
    ADD CONSTRAINT pk_loai_nghiem_phap PRIMARY KEY (ma_nghiem_phap);


--
-- Name: nguoi pk_nguoi; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nguoi
    ADD CONSTRAINT pk_nguoi PRIMARY KEY (ma_nguoi);


--
-- Name: nhanvien pk_nhan_vien; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien
    ADD CONSTRAINT pk_nhan_vien PRIMARY KEY (ma_nhan_vien);


--
-- Name: nhatkyaashangngay pk_nhatkyaashangngay; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyaashangngay
    ADD CONSTRAINT pk_nhatkyaashangngay PRIMARY KEY (ma_nhat_ky_aas);


--
-- Name: nhatkyuashangngay pk_nhatkyuashangngay; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT pk_nhatkyuashangngay PRIMARY KEY (ma_nhat_ky_uas);


--
-- Name: phiennghiemphapkichthich pk_phien_nghiem_phap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phiennghiemphapkichthich
    ADD CONSTRAINT pk_phien_nghiem_phap PRIMARY KEY (ma_phien_nghiem_phap);


--
-- Name: phienkham pk_phienkham; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT pk_phienkham PRIMARY KEY (ma_phien_kham);


--
-- Name: phienkhamcap pk_phienkhamcap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkhamcap
    ADD CONSTRAINT pk_phienkhamcap PRIMARY KEY (ma_phien_kham);


--
-- Name: phienkhamman pk_phienkhamman; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkhamman
    ADD CONSTRAINT pk_phienkhamman PRIMARY KEY (ma_phien_kham);


--
-- Name: quyenhan pk_quyen_han; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quyenhan
    ADD CONSTRAINT pk_quyen_han PRIMARY KEY (ma_quyen_han);


--
-- Name: sanglocbaodongdo pk_sanglocbaodongdo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanglocbaodongdo
    ADD CONSTRAINT pk_sanglocbaodongdo PRIMARY KEY (ma_luot_sang_loc);


--
-- Name: taikhoan pk_tai_khoan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT pk_tai_khoan PRIMARY KEY (ma_tai_khoan);


--
-- Name: tepdinhkem pk_tepdinhkem; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tepdinhkem
    ADD CONSTRAINT pk_tepdinhkem PRIMARY KEY (ma_tep_dinh_kem);


--
-- Name: thuoc pk_thuoc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thuoc
    ADD CONSTRAINT pk_thuoc PRIMARY KEY (ma_thuoc);


--
-- Name: tiensubanthan pk_tiensubanthan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiensubanthan
    ADD CONSTRAINT pk_tiensubanthan PRIMARY KEY (ma_tien_su_ban_than);


--
-- Name: tinhtrangnhiemtrung pk_tinhtrangnhiemtrung; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tinhtrangnhiemtrung
    ADD CONSTRAINT pk_tinhtrangnhiemtrung PRIMARY KEY (ma_tinh_trang_nhiem_trung);


--
-- Name: vaitro pk_vai_tro; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitro
    ADD CONSTRAINT pk_vai_tro PRIMARY KEY (ma_vai_tro);


--
-- Name: vaitroquyenhan pk_vai_tro_quyen_han; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitroquyenhan
    ADD CONSTRAINT pk_vai_tro_quyen_han PRIMARY KEY (ma_vai_tro, ma_quyen_han);


--
-- Name: vitritonthuong pk_vitritonthuong; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitritonthuong
    ADD CONSTRAINT pk_vitritonthuong PRIMARY KEY (ma_vi_tri_ton_thuong);


--
-- Name: benhnhan uq_benh_nhan_ma_his; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhnhan
    ADD CONSTRAINT uq_benh_nhan_ma_his UNIQUE (ma_his);


--
-- Name: benhsucacdotbenhtruoc uq_benhsucacdotbenhtruoc_hoso; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhsucacdotbenhtruoc
    ADD CONSTRAINT uq_benhsucacdotbenhtruoc_hoso UNIQUE (ma_ho_so);


--
-- Name: chukytheodoiuas7 uq_chuky_benhnhan_ngay; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chukytheodoiuas7
    ADD CONSTRAINT uq_chuky_benhnhan_ngay UNIQUE (ma_chu_ky, ma_benh_nhan, ngay_bat_dau);


--
-- Name: hoancanhkhoiphatdiung uq_hoancanhkhoiphatdiung_hoso; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoancanhkhoiphatdiung
    ADD CONSTRAINT uq_hoancanhkhoiphatdiung_hoso UNIQUE (ma_ho_so);


--
-- Name: hosobenhan uq_hoso_benhnhan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosobenhan
    ADD CONSTRAINT uq_hoso_benhnhan UNIQUE (ma_ho_so, ma_benh_nhan);


--
-- Name: hosobenhan uq_hosobenhan_ma_loai; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosobenhan
    ADD CONSTRAINT uq_hosobenhan_ma_loai UNIQUE (ma_ho_so, loai_benh_an);


--
-- Name: khoaphong uq_khoa_phong_chi_nhanh_ten; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khoaphong
    ADD CONSTRAINT uq_khoa_phong_chi_nhanh_ten UNIQUE (ma_chi_nhanh, ten_khoa_phong);


--
-- Name: ketquacanlamsang uq_kqcls_ma_loai; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsang
    ADD CONSTRAINT uq_kqcls_ma_loai UNIQUE (ma_ket_qua_can_lam_sang, loai_ket_qua_can_lam_sang);


--
-- Name: loainghiemphap uq_loai_nghiem_phap_ten; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loainghiemphap
    ADD CONSTRAINT uq_loai_nghiem_phap_ten UNIQUE (ten_nghiem_phap);


--
-- Name: loainghiemphap uq_nghiemphap_phanloai; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loainghiemphap
    ADD CONSTRAINT uq_nghiemphap_phanloai UNIQUE (ma_nghiem_phap, la_can_nguyen_khac);


--
-- Name: nhatkyaashangngay uq_nhatkyaas_benhnhan_ngay; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyaashangngay
    ADD CONSTRAINT uq_nhatkyaas_benhnhan_ngay UNIQUE (ma_benh_nhan, ngay_theo_doi);


--
-- Name: nhatkyuashangngay uq_nhatkyuas_benhnhan_ngay; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT uq_nhatkyuas_benhnhan_ngay UNIQUE (ma_benh_nhan, ngay_cham_diem);


--
-- Name: phienkham uq_phien_hoso; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT uq_phien_hoso UNIQUE (ma_phien_kham, ma_ho_so);


--
-- Name: phiennghiemphapkichthich uq_phien_nghiem_phap_phien_kham; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phiennghiemphapkichthich
    ADD CONSTRAINT uq_phien_nghiem_phap_phien_kham UNIQUE (ma_phien_kham);


--
-- Name: phienkham uq_phienkham_lan_kham; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT uq_phienkham_lan_kham UNIQUE (ma_ho_so, lan_kham_thu);


--
-- Name: phienkham uq_phienkham_ma_loai; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT uq_phienkham_ma_loai UNIQUE (ma_phien_kham, loai_benh_an);


--
-- Name: phongkham uq_phongkham_chi_nhanh_ten; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phongkham
    ADD CONSTRAINT uq_phongkham_chi_nhanh_ten UNIQUE (ma_chi_nhanh, ten_phong_kham);


--
-- Name: quyenhan uq_quyen_han_ten; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quyenhan
    ADD CONSTRAINT uq_quyen_han_ten UNIQUE (ten_quyen_han);


--
-- Name: sanglocbaodongdo uq_sanglocbaodongdo_phien; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanglocbaodongdo
    ADD CONSTRAINT uq_sanglocbaodongdo_phien UNIQUE (ma_phien_ung_dung);


--
-- Name: taikhoan uq_tai_khoan_nguoi; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT uq_tai_khoan_nguoi UNIQUE (ma_nguoi);


--
-- Name: tiensubanthan uq_tiensubanthan_hoso; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiensubanthan
    ADD CONSTRAINT uq_tiensubanthan_hoso UNIQUE (ma_ho_so);


--
-- Name: tinhtrangnhiemtrung uq_tinhtrangnhiemtrung_hoso; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tinhtrangnhiemtrung
    ADD CONSTRAINT uq_tinhtrangnhiemtrung_hoso UNIQUE (ma_ho_so);


--
-- Name: vaitro uq_vai_tro_ten; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitro
    ADD CONSTRAINT uq_vai_tro_ten UNIQUE (ten_vai_tro);


--
-- Name: vitritonthuong uq_vitri_dot; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitritonthuong
    ADD CONSTRAINT uq_vitri_dot UNIQUE (ma_vi_tri_ton_thuong, ma_dot_ton_thuong_da);


--
-- Name: idx_anhchup_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anhchup_dot ON public.anhchuptonthuong USING btree (ma_dot_ton_thuong_da);


--
-- Name: idx_anhchup_ma_tep; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anhchup_ma_tep ON public.anhchuptonthuong USING btree (ma_tep_dinh_kem);


--
-- Name: idx_anhchup_vitri; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anhchup_vitri ON public.anhchuptonthuong USING btree (ma_vi_tri_ton_thuong);


--
-- Name: idx_chi_tiet_kqnp_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chi_tiet_kqnp_loai ON public.chitietketquanghiemphap USING btree (loai_nghiem_phap);


--
-- Name: idx_chi_tiet_kqnp_phien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chi_tiet_kqnp_phien ON public.chitietketquanghiemphap USING btree (ma_phien_nghiem_phap);


--
-- Name: idx_chidanngungthuoc_ma_don_thuoc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chidanngungthuoc_ma_don_thuoc ON public.chidanngungthuoc USING btree (ma_don_thuoc);


--
-- Name: idx_chitietdonthuoc_ma_don_thuoc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chitietdonthuoc_ma_don_thuoc ON public.chitietdonthuoc USING btree (ma_don_thuoc);


--
-- Name: idx_chitietdonthuoc_ma_thuoc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chitietdonthuoc_ma_thuoc ON public.chitietdonthuoc USING btree (ma_thuoc);


--
-- Name: idx_chitiettonthuongsanphu_ma_dac_diem_san_phu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chitiettonthuongsanphu_ma_dac_diem_san_phu ON public.chitiettonthuongsanphu USING btree (ma_dac_diem_san_phu);


--
-- Name: idx_chukyuas7_benhnhan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chukyuas7_benhnhan ON public.chukytheodoiuas7 USING btree (ma_benh_nhan);


--
-- Name: idx_danhgia_phienkhamman; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_danhgia_phienkhamman ON public.danhgiamucdohoatdongbenh USING btree (ma_phien_kham_man);


--
-- Name: idx_danhgiamucdohoatdongbenh_ma_nguoi_danh_gia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_danhgiamucdohoatdongbenh_ma_nguoi_danh_gia ON public.danhgiamucdohoatdongbenh USING btree (ma_nguoi_danh_gia);


--
-- Name: idx_dhst_bacsi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dhst_bacsi ON public.dauhieusinhton USING btree (ma_bac_si);


--
-- Name: idx_dhst_phien_thoi_diem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dhst_phien_thoi_diem ON public.dauhieusinhton USING btree (ma_phien_kham, thoi_diem);


--
-- Name: idx_donthuoc_ma_ho_so; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donthuoc_ma_ho_so ON public.donthuoc USING btree (ma_ho_so);


--
-- Name: idx_donthuoc_ma_phien_kham; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donthuoc_ma_phien_kham ON public.donthuoc USING btree (ma_phien_kham);


--
-- Name: idx_dottonthuong_benhnhan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dottonthuong_benhnhan ON public.dottonthuongda USING btree (ma_benh_nhan);


--
-- Name: idx_dottonthuong_hoso_man; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dottonthuong_hoso_man ON public.dottonthuongda USING btree (ma_ho_so_man);


--
-- Name: idx_hosobenhan_benhnhan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hosobenhan_benhnhan ON public.hosobenhan USING btree (ma_benh_nhan);


--
-- Name: idx_hosobenhan_subtype_cap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hosobenhan_subtype_cap ON public.hosobenhan USING btree (ma_subtype_cap) WHERE (ma_subtype_cap IS NOT NULL);


--
-- Name: idx_hosobenhan_subtype_man; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hosobenhan_subtype_man ON public.hosobenhan USING btree (ma_subtype_man) WHERE (ma_subtype_man IS NOT NULL);


--
-- Name: idx_ketquacanlamsang_subtype_cap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ketquacanlamsang_subtype_cap ON public.ketquacanlamsang USING btree (ma_subtype_cap) WHERE (ma_subtype_cap IS NOT NULL);


--
-- Name: idx_ketquacanlamsang_subtype_man; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ketquacanlamsang_subtype_man ON public.ketquacanlamsang USING btree (ma_subtype_man) WHERE (ma_subtype_man IS NOT NULL);


--
-- Name: idx_ketquaproms_phienkhamman; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ketquaproms_phienkhamman ON public.ketquaproms USING btree (ma_phien_kham_man);


--
-- Name: idx_kqcls_phien_kham; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kqcls_phien_kham ON public.ketquacanlamsang USING btree (ma_phien_kham);


--
-- Name: idx_nhan_vien_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhan_vien_chi_nhanh ON public.nhanvien USING btree (ma_chi_nhanh);


--
-- Name: idx_nhatkyaas_hoso_man; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhatkyaas_hoso_man ON public.nhatkyaashangngay USING btree (ma_ho_so_man);


--
-- Name: idx_nhatkyuas_chuky; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhatkyuas_chuky ON public.nhatkyuashangngay USING btree (ma_chu_ky);


--
-- Name: idx_nhatkyuas_hoso_man; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhatkyuas_hoso_man ON public.nhatkyuashangngay USING btree (ma_ho_so_man);


--
-- Name: idx_phienkham_bacsi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phienkham_bacsi ON public.phienkham USING btree (ma_bac_si);


--
-- Name: idx_phienkham_hoso_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phienkham_hoso_ngay ON public.phienkham USING btree (ma_ho_so, ngay_kham);


--
-- Name: idx_phienkham_phong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phienkham_phong ON public.phienkham USING btree (ma_phong_kham);


--
-- Name: idx_phienkham_subtype_cap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phienkham_subtype_cap ON public.phienkham USING btree (ma_subtype_cap) WHERE (ma_subtype_cap IS NOT NULL);


--
-- Name: idx_phienkham_subtype_man; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phienkham_subtype_man ON public.phienkham USING btree (ma_subtype_man) WHERE (ma_subtype_man IS NOT NULL);


--
-- Name: idx_san_phu_phien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_san_phu_phien ON public.chitiettonthuongsanphu USING btree (ma_phien_kham);


--
-- Name: idx_sanglocbaodongdo_benhnhan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sanglocbaodongdo_benhnhan ON public.sanglocbaodongdo USING btree (ma_benh_nhan) WHERE (ma_benh_nhan IS NOT NULL);


--
-- Name: idx_sanglocbaodongdo_nguyco_thoigian; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sanglocbaodongdo_nguyco_thoigian ON public.sanglocbaodongdo USING btree (thoi_diem_hoan_tat DESC) WHERE co_nguy_co_phan_ve;


--
-- Name: idx_tai_khoan_vai_tro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tai_khoan_vai_tro ON public.taikhoan USING btree (ma_vai_tro);


--
-- Name: idx_tepdinhkem_ma_ho_so; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tepdinhkem_ma_ho_so ON public.tepdinhkem USING btree (ma_ho_so);


--
-- Name: idx_tepdinhkem_tai_khoan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tepdinhkem_tai_khoan ON public.tepdinhkem USING btree (ma_tai_khoan);


--
-- Name: idx_ton_thuong_cap_phien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ton_thuong_cap_phien ON public.chitiettonthuongcaptinh USING btree (ma_phien_kham);


--
-- Name: idx_vitritonthuong_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vitritonthuong_dot ON public.vitritonthuong USING btree (ma_dot_ton_thuong_da);


--
-- Name: idx_vtqh_nguoi_gan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vtqh_nguoi_gan ON public.vaitroquyenhan USING btree (ma_nguoi_gan);


--
-- Name: idx_vtqh_quyen_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vtqh_quyen_han ON public.vaitroquyenhan USING btree (ma_quyen_han);


--
-- Name: uq_tai_khoan_ten_dang_nhap; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_tai_khoan_ten_dang_nhap ON public.taikhoan USING btree (lower((ten_dang_nhap)::text));


--
-- Name: anhchuptonthuong trg_anhchuptonthuong_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_anhchuptonthuong_cap_nhat BEFORE UPDATE ON public.anhchuptonthuong FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: benhanmaydaycap trg_benhanmaydaycap_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_benhanmaydaycap_cap_nhat BEFORE UPDATE ON public.benhanmaydaycap FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: chukytheodoiuas7 trg_chukyuas7_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_chukyuas7_cap_nhat BEFORE UPDATE ON public.chukytheodoiuas7 FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: dauhieusinhton trg_dauhieusinhton_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dauhieusinhton_cap_nhat BEFORE UPDATE ON public.dauhieusinhton FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: donthuoc trg_donthuoc_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_donthuoc_cap_nhat BEFORE UPDATE ON public.donthuoc FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: dottonthuongda trg_dottonthuongda_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dottonthuongda_cap_nhat BEFORE UPDATE ON public.dottonthuongda FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: ketquaproms trg_ketquaproms_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ketquaproms_cap_nhat BEFORE UPDATE ON public.ketquaproms FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: ketquacanlamsangcap trg_kqcls_cap_cap_nhat_cha; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kqcls_cap_cap_nhat_cha AFTER INSERT OR UPDATE ON public.ketquacanlamsangcap FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_cha_kqcls();


--
-- Name: ketquacanlamsang trg_kqcls_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kqcls_cap_nhat BEFORE UPDATE ON public.ketquacanlamsang FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: ketquacanlamsangman trg_kqcls_man_cap_nhat_cha; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kqcls_man_cap_nhat_cha AFTER INSERT OR UPDATE ON public.ketquacanlamsangman FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_cha_kqcls();


--
-- Name: loainghiemphap trg_loainghiemphap_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loainghiemphap_cap_nhat BEFORE UPDATE ON public.loainghiemphap FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: nguoi trg_nguoi_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nguoi_cap_nhat BEFORE UPDATE ON public.nguoi FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: nhatkyaashangngay trg_nhatkyaashangngay_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nhatkyaashangngay_cap_nhat BEFORE UPDATE ON public.nhatkyaashangngay FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: nhatkyuashangngay trg_nhatkyuashangngay_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nhatkyuashangngay_cap_nhat BEFORE UPDATE ON public.nhatkyuashangngay FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: phiennghiemphapkichthich trg_phiennp_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_phiennp_cap_nhat BEFORE UPDATE ON public.phiennghiemphapkichthich FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: quyenhan trg_quyenhan_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_quyenhan_cap_nhat BEFORE UPDATE ON public.quyenhan FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: sanglocbaodongdo trg_sanglocbaodongdo_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sanglocbaodongdo_cap_nhat BEFORE UPDATE ON public.sanglocbaodongdo FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian();


--
-- Name: taikhoan trg_taikhoan_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_taikhoan_cap_nhat BEFORE UPDATE ON public.taikhoan FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: tepdinhkem trg_tepdinhkem_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tepdinhkem_cap_nhat BEFORE UPDATE ON public.tepdinhkem FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: thuoc trg_thuoc_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thuoc_cap_nhat BEFORE UPDATE ON public.thuoc FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: vaitro trg_vaitro_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vaitro_cap_nhat BEFORE UPDATE ON public.vaitro FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: vitritonthuong trg_vitritonthuong_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vitritonthuong_cap_nhat BEFORE UPDATE ON public.vitritonthuong FOR EACH ROW EXECUTE FUNCTION public.fn_cap_nhat_thoi_gian('protect_tao');


--
-- Name: anhchuptonthuong fk_anh_vitri_cung_dot; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anhchuptonthuong
    ADD CONSTRAINT fk_anh_vitri_cung_dot FOREIGN KEY (ma_vi_tri_ton_thuong, ma_dot_ton_thuong_da) REFERENCES public.vitritonthuong(ma_vi_tri_ton_thuong, ma_dot_ton_thuong_da) ON DELETE RESTRICT;


--
-- Name: anhchuptonthuong fk_anhtonthuong_dottonthuongda; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anhchuptonthuong
    ADD CONSTRAINT fk_anhtonthuong_dottonthuongda FOREIGN KEY (ma_dot_ton_thuong_da) REFERENCES public.dottonthuongda(ma_dot_ton_thuong_da) ON DELETE RESTRICT;


--
-- Name: anhchuptonthuong fk_anhtonthuong_tepdinhkem; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anhchuptonthuong
    ADD CONSTRAINT fk_anhtonthuong_tepdinhkem FOREIGN KEY (ma_tep_dinh_kem) REFERENCES public.tepdinhkem(ma_tep_dinh_kem) ON DELETE RESTRICT;


--
-- Name: anhchuptonthuong fk_anhtonthuong_vitritonthuong; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anhchuptonthuong
    ADD CONSTRAINT fk_anhtonthuong_vitritonthuong FOREIGN KEY (ma_vi_tri_ton_thuong) REFERENCES public.vitritonthuong(ma_vi_tri_ton_thuong) ON DELETE RESTRICT;


--
-- Name: benhnhan fk_benh_nhan_nguoi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhnhan
    ADD CONSTRAINT fk_benh_nhan_nguoi FOREIGN KEY (ma_benh_nhan) REFERENCES public.nguoi(ma_nguoi) ON DELETE RESTRICT;


--
-- Name: benhanmaydaycap fk_benhanmaydaycap_hoso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhanmaydaycap
    ADD CONSTRAINT fk_benhanmaydaycap_hoso FOREIGN KEY (ma_ho_so, loai_benh_an) REFERENCES public.hosobenhan(ma_ho_so, loai_benh_an) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: benhanmaydayman fk_benhanmaydayman_hoso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhanmaydayman
    ADD CONSTRAINT fk_benhanmaydayman_hoso FOREIGN KEY (ma_ho_so, loai_benh_an) REFERENCES public.hosobenhan(ma_ho_so, loai_benh_an) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: benhsucacdotbenhtruoc fk_benhsucacdotbenhtruoc_benh_an_man; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benhsucacdotbenhtruoc
    ADD CONSTRAINT fk_benhsucacdotbenhtruoc_benh_an_man FOREIGN KEY (ma_ho_so) REFERENCES public.benhanmaydayman(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: chitietketquanghiemphap fk_chi_tiet_kqnp_loai; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietketquanghiemphap
    ADD CONSTRAINT fk_chi_tiet_kqnp_loai FOREIGN KEY (loai_nghiem_phap) REFERENCES public.loainghiemphap(ma_nghiem_phap) ON DELETE RESTRICT;


--
-- Name: chitietketquanghiemphap fk_chi_tiet_kqnp_phien; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietketquanghiemphap
    ADD CONSTRAINT fk_chi_tiet_kqnp_phien FOREIGN KEY (ma_phien_nghiem_phap) REFERENCES public.phiennghiemphapkichthich(ma_phien_nghiem_phap) ON DELETE RESTRICT;


--
-- Name: chidanngungthuoc fk_chidanngungthuoc_donthuoc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chidanngungthuoc
    ADD CONSTRAINT fk_chidanngungthuoc_donthuoc FOREIGN KEY (ma_don_thuoc) REFERENCES public.donthuoc(ma_don_thuoc) ON DELETE RESTRICT;


--
-- Name: chitietdonthuoc fk_chitietdonthuoc_donthuoc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdonthuoc
    ADD CONSTRAINT fk_chitietdonthuoc_donthuoc FOREIGN KEY (ma_don_thuoc) REFERENCES public.donthuoc(ma_don_thuoc) ON DELETE RESTRICT;


--
-- Name: chitietdonthuoc fk_chitietdonthuoc_thuoc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdonthuoc
    ADD CONSTRAINT fk_chitietdonthuoc_thuoc FOREIGN KEY (ma_thuoc) REFERENCES public.thuoc(ma_thuoc) ON DELETE RESTRICT;


--
-- Name: chitiettonthuongcaptinh fk_chitiettonthuongcaptinh_phien_cap; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiettonthuongcaptinh
    ADD CONSTRAINT fk_chitiettonthuongcaptinh_phien_cap FOREIGN KEY (ma_phien_kham) REFERENCES public.phienkhamcap(ma_phien_kham) ON DELETE RESTRICT;


--
-- Name: chitiettonthuongsanphu fk_chitiettonthuongsanphu_phien_man; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiettonthuongsanphu
    ADD CONSTRAINT fk_chitiettonthuongsanphu_phien_man FOREIGN KEY (ma_phien_kham) REFERENCES public.phienkhamman(ma_phien_kham) ON DELETE RESTRICT;


--
-- Name: chukytheodoiuas7 fk_chukyuas7_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chukytheodoiuas7
    ADD CONSTRAINT fk_chukyuas7_benhnhan FOREIGN KEY (ma_benh_nhan) REFERENCES public.benhnhan(ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: danhgiamucdohoatdongbenh fk_danhgia_nguoi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgiamucdohoatdongbenh
    ADD CONSTRAINT fk_danhgia_nguoi FOREIGN KEY (ma_nguoi_danh_gia) REFERENCES public.nguoi(ma_nguoi) ON DELETE RESTRICT;


--
-- Name: danhgiamucdohoatdongbenh fk_danhgiahoatdong_phienkhamman; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgiamucdohoatdongbenh
    ADD CONSTRAINT fk_danhgiahoatdong_phienkhamman FOREIGN KEY (ma_phien_kham_man) REFERENCES public.phienkhamman(ma_phien_kham) ON DELETE RESTRICT;


--
-- Name: dauhieusinhton fk_dauhieusinhton_bacsi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dauhieusinhton
    ADD CONSTRAINT fk_dauhieusinhton_bacsi FOREIGN KEY (ma_bac_si) REFERENCES public.nhanvien(ma_nhan_vien) ON DELETE RESTRICT;


--
-- Name: dauhieusinhton fk_dauhieusinhton_phienkham; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dauhieusinhton
    ADD CONSTRAINT fk_dauhieusinhton_phienkham FOREIGN KEY (ma_phien_kham) REFERENCES public.phienkham(ma_phien_kham) ON DELETE RESTRICT;


--
-- Name: donthuoc fk_donthuoc_hosobenhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donthuoc
    ADD CONSTRAINT fk_donthuoc_hosobenhan FOREIGN KEY (ma_ho_so) REFERENCES public.hosobenhan(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: donthuoc fk_donthuoc_phien_hoso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donthuoc
    ADD CONSTRAINT fk_donthuoc_phien_hoso FOREIGN KEY (ma_phien_kham, ma_ho_so) REFERENCES public.phienkham(ma_phien_kham, ma_ho_so) ON DELETE RESTRICT;


--
-- Name: dottonthuongda fk_dottonthuongda_benhanman; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dottonthuongda
    ADD CONSTRAINT fk_dottonthuongda_benhanman FOREIGN KEY (ma_ho_so_man) REFERENCES public.benhanmaydayman(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: dottonthuongda fk_dottonthuongda_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dottonthuongda
    ADD CONSTRAINT fk_dottonthuongda_benhnhan FOREIGN KEY (ma_benh_nhan) REFERENCES public.benhnhan(ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: dottonthuongda fk_dottonthuongda_cung_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dottonthuongda
    ADD CONSTRAINT fk_dottonthuongda_cung_benhnhan FOREIGN KEY (ma_ho_so_man, ma_benh_nhan) REFERENCES public.hosobenhan(ma_ho_so, ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: hoancanhkhoiphatdiung fk_hoancanhkhoiphatdiung_hoso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoancanhkhoiphatdiung
    ADD CONSTRAINT fk_hoancanhkhoiphatdiung_hoso FOREIGN KEY (ma_ho_so) REFERENCES public.hosobenhan(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: hosobenhan fk_hoso_bat_buoc_cap; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosobenhan
    ADD CONSTRAINT fk_hoso_bat_buoc_cap FOREIGN KEY (ma_subtype_cap) REFERENCES public.benhanmaydaycap(ma_ho_so) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: hosobenhan fk_hoso_bat_buoc_man; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosobenhan
    ADD CONSTRAINT fk_hoso_bat_buoc_man FOREIGN KEY (ma_subtype_man) REFERENCES public.benhanmaydayman(ma_ho_so) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: hosobenhan fk_hosobenhan_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosobenhan
    ADD CONSTRAINT fk_hosobenhan_benhnhan FOREIGN KEY (ma_benh_nhan) REFERENCES public.benhnhan(ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: ketquaproms fk_ketquaproms_phienkhamman; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquaproms
    ADD CONSTRAINT fk_ketquaproms_phienkhamman FOREIGN KEY (ma_phien_kham_man) REFERENCES public.phienkhamman(ma_phien_kham) ON DELETE RESTRICT;


--
-- Name: khoaphong fk_khoa_phong_chi_nhanh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khoaphong
    ADD CONSTRAINT fk_khoa_phong_chi_nhanh FOREIGN KEY (ma_chi_nhanh) REFERENCES public.chinhanh(ma_chi_nhanh) ON DELETE RESTRICT;


--
-- Name: ketquacanlamsang fk_kqcls_bat_buoc_cap; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsang
    ADD CONSTRAINT fk_kqcls_bat_buoc_cap FOREIGN KEY (ma_subtype_cap) REFERENCES public.ketquacanlamsangcap(ma_ket_qua_can_lam_sang) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: ketquacanlamsang fk_kqcls_bat_buoc_man; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsang
    ADD CONSTRAINT fk_kqcls_bat_buoc_man FOREIGN KEY (ma_subtype_man) REFERENCES public.ketquacanlamsangman(ma_ket_qua_can_lam_sang) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: ketquacanlamsangcap fk_kqcls_cap_cha; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsangcap
    ADD CONSTRAINT fk_kqcls_cap_cha FOREIGN KEY (ma_ket_qua_can_lam_sang, loai_ket_qua_can_lam_sang) REFERENCES public.ketquacanlamsang(ma_ket_qua_can_lam_sang, loai_ket_qua_can_lam_sang) ON DELETE CASCADE;


--
-- Name: ketquacanlamsangman fk_kqcls_man_cha; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsangman
    ADD CONSTRAINT fk_kqcls_man_cha FOREIGN KEY (ma_ket_qua_can_lam_sang, loai_ket_qua_can_lam_sang) REFERENCES public.ketquacanlamsang(ma_ket_qua_can_lam_sang, loai_ket_qua_can_lam_sang) ON DELETE CASCADE;


--
-- Name: ketquacanlamsang fk_kqcls_phien_kham; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ketquacanlamsang
    ADD CONSTRAINT fk_kqcls_phien_kham FOREIGN KEY (ma_phien_kham, loai_ket_qua_can_lam_sang) REFERENCES public.phienkham(ma_phien_kham, loai_benh_an) ON DELETE RESTRICT;


--
-- Name: chitietketquanghiemphap fk_kqnp_phanloai; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietketquanghiemphap
    ADD CONSTRAINT fk_kqnp_phanloai FOREIGN KEY (loai_nghiem_phap, la_can_nguyen_khac) REFERENCES public.loainghiemphap(ma_nghiem_phap, la_can_nguyen_khac) ON DELETE RESTRICT;


--
-- Name: nhanvien fk_nhan_vien_chi_nhanh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien
    ADD CONSTRAINT fk_nhan_vien_chi_nhanh FOREIGN KEY (ma_chi_nhanh) REFERENCES public.chinhanh(ma_chi_nhanh) ON DELETE RESTRICT;


--
-- Name: nhanvien fk_nhan_vien_nguoi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien
    ADD CONSTRAINT fk_nhan_vien_nguoi FOREIGN KEY (ma_nhan_vien) REFERENCES public.nguoi(ma_nguoi) ON DELETE RESTRICT;


--
-- Name: nhatkyaashangngay fk_nhatkyaas_benhanman; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyaashangngay
    ADD CONSTRAINT fk_nhatkyaas_benhanman FOREIGN KEY (ma_ho_so_man) REFERENCES public.benhanmaydayman(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: nhatkyaashangngay fk_nhatkyaas_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyaashangngay
    ADD CONSTRAINT fk_nhatkyaas_benhnhan FOREIGN KEY (ma_benh_nhan) REFERENCES public.benhnhan(ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: nhatkyaashangngay fk_nhatkyaashangngay_cung_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyaashangngay
    ADD CONSTRAINT fk_nhatkyaashangngay_cung_benhnhan FOREIGN KEY (ma_ho_so_man, ma_benh_nhan) REFERENCES public.hosobenhan(ma_ho_so, ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: nhatkyuashangngay fk_nhatkyuas_benhanman; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT fk_nhatkyuas_benhanman FOREIGN KEY (ma_ho_so_man) REFERENCES public.benhanmaydayman(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: nhatkyuashangngay fk_nhatkyuas_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT fk_nhatkyuas_benhnhan FOREIGN KEY (ma_benh_nhan) REFERENCES public.benhnhan(ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: nhatkyuashangngay fk_nhatkyuas_chuky; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT fk_nhatkyuas_chuky FOREIGN KEY (ma_chu_ky) REFERENCES public.chukytheodoiuas7(ma_chu_ky) ON DELETE RESTRICT;


--
-- Name: nhatkyuashangngay fk_nhatkyuashangngay_cung_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT fk_nhatkyuashangngay_cung_benhnhan FOREIGN KEY (ma_ho_so_man, ma_benh_nhan) REFERENCES public.hosobenhan(ma_ho_so, ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: phienkham fk_phien_bat_buoc_cap; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT fk_phien_bat_buoc_cap FOREIGN KEY (ma_subtype_cap) REFERENCES public.phienkhamcap(ma_phien_kham) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: phienkham fk_phien_bat_buoc_man; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT fk_phien_bat_buoc_man FOREIGN KEY (ma_subtype_man) REFERENCES public.phienkhamman(ma_phien_kham) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: phiennghiemphapkichthich fk_phien_np_phien_kham_man; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phiennghiemphapkichthich
    ADD CONSTRAINT fk_phien_np_phien_kham_man FOREIGN KEY (ma_phien_kham) REFERENCES public.phienkhamman(ma_phien_kham) ON DELETE RESTRICT;


--
-- Name: phienkham fk_phienkham_bacsi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT fk_phienkham_bacsi FOREIGN KEY (ma_bac_si) REFERENCES public.nhanvien(ma_nhan_vien) ON DELETE RESTRICT;


--
-- Name: phienkham fk_phienkham_hoso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT fk_phienkham_hoso FOREIGN KEY (ma_ho_so, loai_benh_an) REFERENCES public.hosobenhan(ma_ho_so, loai_benh_an);


--
-- Name: phienkham fk_phienkham_phong; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkham
    ADD CONSTRAINT fk_phienkham_phong FOREIGN KEY (ma_phong_kham) REFERENCES public.phongkham(ma_phong_kham) ON DELETE RESTRICT;


--
-- Name: phienkhamcap fk_phienkhamcap_phienkham; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkhamcap
    ADD CONSTRAINT fk_phienkhamcap_phienkham FOREIGN KEY (ma_phien_kham, loai_benh_an) REFERENCES public.phienkham(ma_phien_kham, loai_benh_an) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: phienkhamman fk_phienkhamman_phienkham; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phienkhamman
    ADD CONSTRAINT fk_phienkhamman_phienkham FOREIGN KEY (ma_phien_kham, loai_benh_an) REFERENCES public.phienkham(ma_phien_kham, loai_benh_an) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: phongkham fk_phongkham_chi_nhanh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phongkham
    ADD CONSTRAINT fk_phongkham_chi_nhanh FOREIGN KEY (ma_chi_nhanh) REFERENCES public.chinhanh(ma_chi_nhanh) ON DELETE RESTRICT;


--
-- Name: sanglocbaodongdo fk_sanglocbaodongdo_benhnhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanglocbaodongdo
    ADD CONSTRAINT fk_sanglocbaodongdo_benhnhan FOREIGN KEY (ma_benh_nhan) REFERENCES public.benhnhan(ma_benh_nhan) ON DELETE RESTRICT;


--
-- Name: chitiettonthuongsanphu fk_sanphu_dacdiem; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiettonthuongsanphu
    ADD CONSTRAINT fk_sanphu_dacdiem FOREIGN KEY (ma_dac_diem_san_phu) REFERENCES public.dacdiemsanphu(ma_dac_diem_san_phu) ON DELETE RESTRICT;


--
-- Name: taikhoan fk_tai_khoan_nguoi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT fk_tai_khoan_nguoi FOREIGN KEY (ma_nguoi) REFERENCES public.nguoi(ma_nguoi) ON DELETE RESTRICT;


--
-- Name: taikhoan fk_tai_khoan_vai_tro; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT fk_tai_khoan_vai_tro FOREIGN KEY (ma_vai_tro) REFERENCES public.vaitro(ma_vai_tro) ON DELETE RESTRICT;


--
-- Name: tepdinhkem fk_tepdinhkem_hosobenhan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tepdinhkem
    ADD CONSTRAINT fk_tepdinhkem_hosobenhan FOREIGN KEY (ma_ho_so) REFERENCES public.hosobenhan(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: tepdinhkem fk_tepdinhkem_taikhoan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tepdinhkem
    ADD CONSTRAINT fk_tepdinhkem_taikhoan FOREIGN KEY (ma_tai_khoan) REFERENCES public.taikhoan(ma_tai_khoan) ON DELETE SET NULL;


--
-- Name: tiensubanthan fk_tiensubanthan_hoso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiensubanthan
    ADD CONSTRAINT fk_tiensubanthan_hoso FOREIGN KEY (ma_ho_so) REFERENCES public.hosobenhan(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: tinhtrangnhiemtrung fk_tinhtrangnhiemtrung_benh_an_cap; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tinhtrangnhiemtrung
    ADD CONSTRAINT fk_tinhtrangnhiemtrung_benh_an_cap FOREIGN KEY (ma_ho_so) REFERENCES public.benhanmaydaycap(ma_ho_so) ON DELETE RESTRICT;


--
-- Name: nhatkyuashangngay fk_uas_chuky_benhnhan_ngay; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyuashangngay
    ADD CONSTRAINT fk_uas_chuky_benhnhan_ngay FOREIGN KEY (ma_chu_ky, ma_benh_nhan, ngay_bat_dau_chu_ky) REFERENCES public.chukytheodoiuas7(ma_chu_ky, ma_benh_nhan, ngay_bat_dau) ON DELETE RESTRICT;


--
-- Name: vitritonthuong fk_vitritonthuong_dottonthuongda; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitritonthuong
    ADD CONSTRAINT fk_vitritonthuong_dottonthuongda FOREIGN KEY (ma_dot_ton_thuong_da) REFERENCES public.dottonthuongda(ma_dot_ton_thuong_da) ON DELETE RESTRICT;


--
-- Name: vaitroquyenhan fk_vtqh_nguoi_gan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitroquyenhan
    ADD CONSTRAINT fk_vtqh_nguoi_gan FOREIGN KEY (ma_nguoi_gan) REFERENCES public.nguoi(ma_nguoi) ON DELETE RESTRICT;


--
-- Name: vaitroquyenhan fk_vtqh_quyen_han; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitroquyenhan
    ADD CONSTRAINT fk_vtqh_quyen_han FOREIGN KEY (ma_quyen_han) REFERENCES public.quyenhan(ma_quyen_han) ON DELETE CASCADE;


--
-- Name: vaitroquyenhan fk_vtqh_vai_tro; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitroquyenhan
    ADD CONSTRAINT fk_vtqh_vai_tro FOREIGN KEY (ma_vai_tro) REFERENCES public.vaitro(ma_vai_tro) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jkmOIwIdfBxOuYMZSSMQdQnZb35u9nKnd583E33RiJeX4bX5w4KW687fIVYx2Lt

