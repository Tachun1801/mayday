const identifier = (value) => typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n
export function ownRecord(record, patientId) {
  return identifier(patientId) && identifier(record?.ma_ho_so) && String(record?.ma_benh_nhan) === patientId
}
export function activeRecord(record) { return ['draft', 'in_progress'].includes(record?.trang_thai) }
export function todayInVietnam(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function dailyPayload(recordId, day, hss, iss) {
  if (!identifier(recordId) || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^[0-3]$/.test(hss) || !/^[0-3]$/.test(iss)) throw new Error('Chọn hồ sơ và cả hai điểm từ 0 đến 3.')
  return { ma_ho_so_man: recordId, ngay_cham_diem: day, diem_san_phu_hss: Number(hss), diem_ngua_iss: Number(iss) }
}
export function recordStatus(status) {
  return { draft: 'Đã tạo hồ sơ', in_progress: 'Đang theo dõi', completed: 'Đã hoàn tất', pending: 'Đang chờ', cancelled: 'Đã hủy' }[status] || 'Trạng thái khác'
}
