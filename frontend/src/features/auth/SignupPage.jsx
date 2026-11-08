import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { requestApi } from '../../shared/api/business.js'
import { useSession } from './context.js'
import { isSessionActive, sessionHome } from './session.js'

export function SignupPage() {
  const { session } = useSession()
  const request = useRef(null)
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false), [uncertain, setUncertain] = useState(false)
  useEffect(() => () => request.current?.abort(), [])
  if (isSessionActive(session)) return <Navigate to={sessionHome(session.user)} replace />
  async function submit(event) {
    event.preventDefault()
    if (request.current || uncertain) return
    const form = new FormData(event.currentTarget), password = String(form.get('password'))
    if (password !== form.get('confirm')) { setError('Xác nhận mật khẩu chưa khớp.'); return }
    const bytes = new TextEncoder().encode(password).length
    if (bytes < 12 || bytes > 72) { setError('Mật khẩu cần dài từ 12 đến 72 byte.'); return }
    const controller = new AbortController(); request.current = controller; setPending(true); setError('')
    try {
      const result = await requestApi('/auth/signup', { method: 'POST', signal: controller.signal, data: {
        username: String(form.get('username')).trim(), password, full_name: String(form.get('full_name')).trim(),
        phone: String(form.get('phone')), birth_date: form.get('birth_date') || null, gender: form.get('gender') || null,
      } })
      if (controller.signal.aborted) return
      if (![result?.account_id, result?.patient_id].every((value) => typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n)) throw new Error('Chưa xác nhận được kết quả đăng ký. Hãy thử đăng nhập trước khi đăng ký lại.')
      event.target.reset(); setDone(true)
    } catch (failure) {
      if (controller.signal.aborted) return
      setError(failure.status === 404 ? 'Đăng ký trực tuyến hiện chưa được cơ sở y tế bật.' : failure.message)
      // A lost response can follow COMMIT. Keep the form locked rather than
      // creating another identity automatically; login is the recovery path.
      if (![400, 403, 404, 409, 429].includes(failure.status)) setUncertain(true)
    } finally { if (!controller.signal.aborted) { request.current = null; setPending(false) } }
  }
  return <section className="login-panel"><p className="eyebrow">Dành cho bệnh nhân</p><h1>Đăng ký tài khoản</h1>
    {done ? <div role="status"><h2>Đã tạo tài khoản</h2><p>Bạn có thể đăng nhập để xem thông tin cá nhân. Khi đến khám, cung cấp tên đăng nhập và số điện thoại cho cơ sở y tế để tiếp nhận hồ sơ lần đầu.</p></div> : <>
      <p>Đăng ký không thay thế việc tiếp nhận hoặc khám tại cơ sở y tế. Số điện thoại chưa được xác minh bằng OTP.</p>
      <form className="intake-form" onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending || uncertain}><legend>Thông tin tài khoản bệnh nhân</legend>
          <label htmlFor="signup-name">Họ và tên<input id="signup-name" name="full_name" autoComplete="name" required maxLength={150} /></label>
          <label htmlFor="signup-phone">Số điện thoại<input id="signup-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" required pattern="[0-9]{10}" maxLength={10} /></label>
          <label htmlFor="signup-birth">Ngày sinh (không bắt buộc)<input id="signup-birth" name="birth_date" type="date" autoComplete="bday" /></label>
          <label htmlFor="signup-gender">Giới tính (không bắt buộc)<select id="signup-gender" name="gender"><option value="">Chưa nhập</option><option value="Nam">Nam</option><option value="Nu">Nữ</option></select></label>
          <label htmlFor="signup-username">Tên đăng nhập<input id="signup-username" name="username" autoComplete="username" required maxLength={100} /></label>
          <label htmlFor="signup-password">Mật khẩu (12–72 byte)<input id="signup-password" name="password" type="password" autoComplete="new-password" required /></label>
          <label htmlFor="signup-confirm">Nhập lại mật khẩu<input id="signup-confirm" name="confirm" type="password" autoComplete="new-password" required /></label>
          <button disabled={pending} type="submit">{pending ? 'Đang đăng ký…' : 'Tạo tài khoản bệnh nhân'}</button>
        </fieldset>
      </form>{error && <p className="error" role="alert">{error}</p>}
      {uncertain && <p role="status">Chưa rõ tài khoản đã được tạo hay chưa. Vui lòng thử đăng nhập hoặc liên hệ cơ sở y tế trước khi đăng ký lại.</p>}
    </>}
    <p><Link to="/login">Đăng nhập</Link></p>
  </section>
}
