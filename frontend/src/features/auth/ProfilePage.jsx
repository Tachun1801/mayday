import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResource } from '../../shared/use-resource.js'
import { ResourceState } from '../../shared/ui/DataView.jsx'
import { requestApi } from '../../shared/api/business.js'
import { useSession } from './context.js'

export function ProfilePage() {
  const state = useResource('/auth/me')
  const { session, signOut, updateUser } = useSession()
  const navigate = useNavigate()
  const [pending, setPending] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const user = state.data?.user_info
  async function saveProfile(event) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    const data = { full_name: String(form.get('full_name')).trim() }
    if ('phone' in user) data.phone = String(form.get('phone')).trim()
    if ('birth_date' in user) data.birth_date = form.get('birth_date') || null
    if ('gender' in user) data.gender = form.get('gender') || null
    setPending('profile'); setError(''); setMessage('')
    try {
      const result = await requestApi('/auth/me', { method: 'PUT', token: session.token, data })
      if (!result?.user_info) throw new Error('Không nhận được thông tin tài khoản đã cập nhật.')
      updateUser(result.user_info)
      state.retry()
      setMessage('Đã cập nhật thông tin cá nhân.')
    } catch (failure) {
      if (failure.status === 401) signOut()
      else setError(failure.message)
    } finally { setPending('') }
  }
  async function changePassword(event) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    const oldPassword = String(form.get('old_password'))
    const newPassword = String(form.get('new_password'))
    const size = new TextEncoder().encode(newPassword).length
    if (size < 12 || size > 72) { setError('Mật khẩu mới cần dài từ 12 đến 72 byte.'); return }
    if (newPassword !== form.get('confirm_password')) { setError('Xác nhận mật khẩu chưa khớp.'); return }
    setPending('password'); setError(''); setMessage('')
    try {
      const result = await requestApi('/auth/change-password', {
        method: 'POST', token: session.token, data: { old_password: oldPassword, new_password: newPassword },
      })
      if (!result?.reauthenticate) throw new Error('Chưa xác nhận được đổi mật khẩu. Vui lòng kiểm tra lại.')
      signOut()
      navigate('/login', { replace: true, state: { notice: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' } })
    } catch (failure) {
      if (failure.status === 401) signOut()
      else setError(failure.message)
    } finally { setPending('') }
  }
  return <section><h1>Hồ sơ tài khoản</h1><ResourceState {...state} />
    {!state.loading && !state.error && user && <>
      <p>Tên đăng nhập: <strong>{user.username}</strong> · Mã tài khoản: {user.account_id}</p>
      <form onSubmit={saveProfile} className="intake-form" aria-busy={pending === 'profile'}>
        <h2>Thông tin cá nhân</h2>
        <label htmlFor="full-name">Họ và tên<input id="full-name" name="full_name" defaultValue={user.full_name || ''} required maxLength={150} /></label>
        {'phone' in user && <label htmlFor="profile-phone">Số điện thoại<input id="profile-phone" name="phone" defaultValue={user.phone || ''} type="tel" pattern="[0-9]{10}" maxLength={10} required /></label>}
        {'birth_date' in user && <label htmlFor="profile-birth">Ngày sinh<input id="profile-birth" name="birth_date" type="date" defaultValue={user.birth_date || ''} /></label>}
        {'gender' in user && <label htmlFor="profile-gender">Giới tính<select id="profile-gender" name="gender" defaultValue={user.gender || ''}><option value="">Chưa nhập</option><option value="Nam">Nam</option><option value="Nu">Nữ</option></select></label>}
        <button type="submit" disabled={Boolean(pending)}>{pending === 'profile' ? 'Đang lưu…' : 'Lưu thông tin cá nhân'}</button>
      </form>
      <form onSubmit={changePassword} className="intake-form" aria-busy={pending === 'password'}>
        <h2>Đổi mật khẩu</h2><p>Đổi mật khẩu làm mất hiệu lực các token cũ. Bạn sẽ cần đăng nhập lại.</p>
        <label htmlFor="old-password">Mật khẩu hiện tại<input id="old-password" name="old_password" type="password" autoComplete="current-password" required /></label>
        <label htmlFor="new-password">Mật khẩu mới (12–72 byte)<input id="new-password" name="new_password" type="password" autoComplete="new-password" required aria-describedby="password-help" /></label>
        <p id="password-help">Ký tự có dấu có thể chiếm nhiều byte; backend tiếp tục kiểm tra mật khẩu.</p>
        <label htmlFor="confirm-password">Nhập lại mật khẩu mới<input id="confirm-password" name="confirm_password" type="password" autoComplete="new-password" required /></label>
        <button type="submit" disabled={Boolean(pending)}>{pending === 'password' ? 'Đang đổi…' : 'Đổi mật khẩu'}</button>
      </form>
    </>}
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status">{message}</p>}
  </section>
}
