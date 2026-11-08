export function createSession(data, now = Date.now()) {
  if (typeof data?.token !== 'string' || !data.token || !data.user_info ||
      !Number.isFinite(data.expires_in) || data.expires_in <= 0) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.')
  }
  if (!data.user_info.staff_id && !data.user_info.patient_id) throw new Error('Tài khoản chưa có hồ sơ nhân viên hoặc bệnh nhân được hỗ trợ.')
  return { token: data.token, user: data.user_info, expiresAt: now + data.expires_in * 1000 }
}

export function sessionHome(user) {
  return user?.staff_id ? '/patients' : user?.patient_id ? '/portal' : '/login'
}

export function isSessionActive(session, now = Date.now()) {
  return Boolean(session?.token && session.expiresAt > now)
}
