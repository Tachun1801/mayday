import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '../../shared/use-mutation.js'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
import { intakePayload } from './intake-payload.js'

export function NewIntakePage() {
  const navigate = useNavigate()
  const mutation = useMutation('/intakes', 'POST', (data) => {
    if (typeof data.record_id !== 'string' || !/^[1-9]\d*$/.test(data.record_id)) throw new Error('Cần kiểm tra danh sách hồ sơ trước khi gửi lại.')
    navigate(`/medical-records/${encodeURIComponent(data.record_id)}`)
  })
  const { pending, error } = mutation
  function submit(event) {
    event.preventDefault()
    mutation.save(intakePayload(Object.fromEntries(new FormData(event.currentTarget))))
  }
  return <section><Link to="/patients">← Danh sách bệnh nhân</Link><h1>Tiếp nhận bệnh nhân mới</h1>
    <p>Tạo bệnh nhân mới, hồ sơ nháp và phiên khám đầu tiên. Biểu mẫu này không gán lại hồ sơ của bệnh nhân đã có.</p>
    <form onSubmit={submit} className="intake-form" aria-busy={pending} aria-describedby={error ? 'intake-error' : undefined}>
      <fieldset disabled={pending || mutation.requiresReadback}><legend>Bệnh nhân mới và hồ sơ đầu</legend>
      <label htmlFor="ho-ten">Họ và tên<input id="ho-ten" name="ho_ten" required maxLength={150} autoComplete="off" /></label>
      <label htmlFor="so-dien-thoai">Số điện thoại (10 chữ số)<input id="so-dien-thoai" name="so_dien_thoai" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required autoComplete="off" /></label>
      <label htmlFor="ngay-sinh">Ngày sinh (không bắt buộc)<input id="ngay-sinh" name="ngay_sinh" type="date" /></label>
      <label htmlFor="gioi-tinh">Giới tính (không bắt buộc)<select id="gioi-tinh" name="gioi_tinh"><option value="">Chưa nhập</option><option value="Nam">Nam</option><option value="Nu">Nữ</option></select></label>
      <label htmlFor="loai-benh-an">Loại bệnh án<select id="loai-benh-an" name="loai_benh_an" required defaultValue=""><option value="" disabled>Chọn loại bệnh án</option><option value="CAP">Mề đay cấp</option><option value="MAN">Mề đay mạn</option></select></label>
      <label htmlFor="ngay-kham">Ngày khám<input id="ngay-kham" name="ngay_kham" type="date" required /></label>
      <label htmlFor="ma-phong-kham">Mã phòng khám (không bắt buộc)<input id="ma-phong-kham" name="ma_phong_kham" inputMode="numeric" pattern="[1-9][0-9]*" /></label>
      <p>Backend xác định bác sĩ từ phiên đăng nhập và kiểm tra phòng thuộc chi nhánh. Hồ sơ mới ở trạng thái nháp.</p>
      <button type="submit" disabled={pending}>{pending ? 'Đang tiếp nhận…' : 'Tạo hồ sơ nháp và phiên khám'}</button></fieldset>
      <div id="intake-error"><MutationStatus mutation={mutation} reload={() => navigate('/patients')} /></div>
    </form>
  </section>
}
