export function intakePayload(values) {
  const patient = {
    ho_ten: values.ho_ten.trim(),
    so_dien_thoai: values.so_dien_thoai.trim(),
  }
  if (values.ngay_sinh) patient.ngay_sinh = values.ngay_sinh
  if (values.gioi_tinh) patient.gioi_tinh = values.gioi_tinh
  const visit = { ngay_kham: values.ngay_kham }
  if (values.ma_phong_kham?.trim()) visit.ma_phong_kham = values.ma_phong_kham.trim()
  return { patient, record: { loai_benh_an: values.loai_benh_an }, visit }
}
