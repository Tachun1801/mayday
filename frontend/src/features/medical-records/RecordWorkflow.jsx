import { useEffect, useRef, useState } from 'react'
import { requestApi } from '../../shared/api/business.js'
import { useSession } from '../auth/context.js'
import { nextRecordAction, validateStatusResponse } from './record-workflow.js'

export function RecordWorkflow({ record, onChanged }) {
  const { session, signOut } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [requiresReload, setRequiresReload] = useState(false)
  const request = useRef(null)
  useEffect(() => () => request.current?.abort(), [])
  const action = nextRecordAction(record.trang_thai)
  if (record.trang_thai === 'completed') return <p role="status">Hồ sơ đã hoàn tất.</p>
  if (!action || !session?.user.staff_id || record.assigned_to_current_doctor === false) return null
  async function submit(event) {
    event.preventDefault()
    // The ref closes the gap before React renders disabled controls.
    if (request.current || requiresReload) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const data = await requestApi(`/medical-records/${encodeURIComponent(record.ma_ho_so)}/status`, {
        method: 'PATCH', token: session.token, data: { status: action.status }, signal: controller.signal,
      })
      if (controller.signal.aborted) return
      validateStatusResponse(data, record.ma_ho_so, action.status)
      onChanged(action.status)
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) signOut()
      else {
        setError(failure.message)
        // A timeout can arrive after COMMIT. Require readback before another
        // mutation, including after a concurrent transition or malformed reply.
        setRequiresReload(true)
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null
        setPending(false)
      }
    }
  }
  return <form className="record-workflow" onSubmit={submit} aria-busy={pending}>
    <h2>Xử lý hồ sơ</h2>
    <p>Chỉ bác sĩ được phân công được chuyển trạng thái. Hồ sơ hoàn tất không thể chuyển ngược bằng thao tác này.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <button type="submit" disabled={pending || requiresReload}>{pending ? 'Đang cập nhật…' : action.label}</button>
    {requiresReload && <button className="secondary" type="button" onClick={() => onChanged()}>Tải lại trạng thái hồ sơ</button>}
  </form>
}
