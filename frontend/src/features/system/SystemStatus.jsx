import { useEffect, useState } from 'react'
import { fetchSystemStatus } from './system.api.js'

export function SystemStatus() {
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchSystemStatus(controller.signal)
      .then(() => { if (!controller.signal.aborted) setStatus('success') })
      .catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [attempt])

  function retry() {
    setStatus('loading')
    setAttempt((value) => value + 1)
  }

  return (
    <section aria-labelledby="status-heading">
      <h2 id="status-heading">Trạng thái hệ thống</h2>
      <p role="status" aria-live="polite">
        {status === 'loading' && 'Đang kiểm tra kết nối…'}
        {status === 'success' && 'Dịch vụ đang hoạt động.'}
        {status === 'error' && 'Chưa thể kết nối dịch vụ. Vui lòng thử lại.'}
      </p>
      {status === 'error' && <button type="button" onClick={retry}>Thử lại</button>}
    </section>
  )
}
