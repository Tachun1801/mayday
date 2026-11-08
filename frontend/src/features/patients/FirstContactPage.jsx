import { useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldDetails } from '../../shared/ui/DataView.jsx'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
import { useMutation } from '../../shared/use-mutation.js'

export function FirstContactPage() {
  const [version, setVersion] = useState(0)
  return <FirstContact key={version} reset={() => setVersion((value) => value + 1)} />
}
function FirstContact({ reset }) {
  const [candidate, setCandidate] = useState(null), [contact, setContact] = useState(null)
  const lookupInput = useRef(null)
  const id = useId()
  const mutation = useMutation('/patients/first-contact/lookup', 'POST', (data) => {
    if (typeof data.patient_id !== 'string' || !/^[1-9]\d*$/.test(data.patient_id)) throw new Error('Phản hồi tra cứu chưa hợp lệ.')
    setContact(lookupInput.current)
    setCandidate(data)
  })
  function submit(event) {
    event.preventDefault()
    if (lookupInput.current) return
    const form = new FormData(event.currentTarget), input = { username: String(form.get('username')).trim(), phone: String(form.get('phone')) }
    lookupInput.current = input; mutation.save(input)
  }
  return <section><Link to="/patients">← Danh sách bệnh nhân</Link><h1>Tiếp nhận tài khoản bệnh nhân lần đầu</h1>
    <p>Chỉ tra cứu khi khớp chính xác tên đăng nhập và số điện thoại bệnh nhân cung cấp. Không hiển thị danh sách toàn bộ bệnh nhân hoặc hồ sơ của bác sĩ khác.</p>
    {candidate ? <>
      <FieldDetails record={candidate} fields={[["patient_id", 'Mã bệnh nhân'], ['full_name', 'Họ tên'], ['birth_date', 'Ngày sinh'], ['gender', 'Giới tính']]} />
      <FirstIntake candidate={candidate} contact={contact} reset={reset} />
    </> : <form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
      <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Thông tin khớp chính xác</legend>
        <label htmlFor={`${id}-username`}>Tên đăng nhập bệnh nhân<input id={`${id}-username`} name="username" required maxLength={100} autoComplete="off" /></label>
        <label htmlFor={`${id}-phone`}>Số điện thoại bệnh nhân<input id={`${id}-phone`} name="phone" required pattern="[0-9]{10}" maxLength={10} inputMode="numeric" autoComplete="off" /></label>
        <button type="submit">Tra cứu tài khoản chưa có hồ sơ</button>
      </fieldset><MutationStatus mutation={mutation} reload={reset} />
    </form>}
    <p>Nếu vừa tiếp nhận nhưng phản hồi bị lỗi, kiểm tra <Link to="/medical-records">danh sách hồ sơ được phân công</Link> trước khi thao tác tiếp. Không tự tạo danh tính mới khi tra cứu không khớp.</p>
  </section>
}
function FirstIntake({ candidate, contact, reset }) {
  const id = useId(), navigate = useNavigate()
  const mutation = useMutation(`/patients/${encodeURIComponent(candidate.patient_id)}/first-contact`, 'POST', (data) => {
    if (typeof data.record_id !== 'string' || !/^[1-9]\d*$/.test(data.record_id)) throw new Error('Cần đọc lại danh sách hồ sơ để xác nhận tiếp nhận.')
    navigate(`/medical-records/${encodeURIComponent(data.record_id)}`)
  })
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.save({ ...contact, record: { loai_benh_an: form.get('type') }, visit: { ngay_kham: form.get('date'), ma_phong_kham: form.get('room') || null } })
  }
  return <form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Hồ sơ và phiên khám đầu tiên</legend>
      <label htmlFor={`${id}-type`}>Loại bệnh án<select id={`${id}-type`} name="type" required><option value="CAP">Mề đay cấp</option><option value="MAN">Mề đay mạn</option></select></label>
      <label htmlFor={`${id}-date`}>Ngày khám<input id={`${id}-date`} name="date" type="date" required /></label>
      <label htmlFor={`${id}-room`}>Mã phòng khám (không bắt buộc)<input id={`${id}-room`} name="room" pattern="[1-9][0-9]*" /></label>
      <p>Backend kiểm tra lại thông tin, khóa bệnh nhân và chỉ tiếp nhận lần đầu một lần. Bác sĩ là chính tài khoản đang đăng nhập; phòng phải cùng chi nhánh.</p>
      <button type="submit">Xác nhận tiếp nhận lần đầu</button>
    </fieldset><MutationStatus mutation={mutation} reload={reset} />
    <button className="secondary" type="button" onClick={reset} disabled={mutation.pending}>Tra cứu lại thông tin</button>
  </form>
}
