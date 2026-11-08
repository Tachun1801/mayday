import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { requestApi } from '../../shared/api/business.js'
import { isSessionActive, sessionHome } from './session.js'
import { useSession } from './context.js'

export function LoginPage() {
  const location = useLocation()
  const { session, signIn } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  if (isSessionActive(session)) return <Navigate to={sessionHome(session.user)} replace />
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      const result = await requestApi('/auth/login', {
        method: 'POST', data: { username: String(form.get('username')).trim(), password: String(form.get('password')) },
      })
      signIn(result)
    } catch (failure) {
      setError(failure.status === 401 ? 'Tên đăng nhập hoặc mật khẩu không đúng.' : failure.message)
    } finally { setPending(false) }
  }
  return <section className="login-panel">
    <p className="eyebrow">Bệnh nhân và nhân viên y tế</p><h1>Đăng nhập DrMayDay</h1>
    <p>Phiên đăng nhập chỉ được giữ trong bộ nhớ của trang này. Tải lại trang sẽ cần đăng nhập lại.</p>
    <p role="status">{location.state?.notice}</p>
    <form onSubmit={submit} aria-busy={pending} aria-describedby={error ? 'login-error' : undefined}>
      <label htmlFor="username">Tên đăng nhập</label>
      <input id="username" name="username" autoComplete="username" required maxLength={100} />
      <label htmlFor="password">Mật khẩu</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {error && <p role="alert" id="login-error" className="error">{error}</p>}
      <button disabled={pending} type="submit">{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
    <p>Bạn chưa có tài khoản bệnh nhân? <Link to="/register">Đăng ký tài khoản</Link></p>
  </section>
}
