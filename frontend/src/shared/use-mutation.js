import { useEffect, useRef, useState } from 'react'
import { requestApi } from './api/business.js'
import { useSession } from './session/context.js'

export function useMutation(path, method, onSaved) {
  const { session, signOut } = useSession()
  const request = useRef(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [requiresReadback, setRequiresReadback] = useState(false)
  useEffect(() => () => request.current?.abort(), [])
  async function save(data) {
    if (request.current || requiresReadback) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const response = await requestApi(path, { method, token: session.token, signal: controller.signal, data })
      if (controller.signal.aborted) return
      if (!response || typeof response !== 'object' || !Object.entries(response).some(([key, value]) => (key === 'id' || key.endsWith('_id')) && typeof value === 'string' && value.length > 0 && value.length <= 255)) throw new Error('Phản hồi chưa xác nhận mã bản ghi. Cần tải lại trước khi thao tác tiếp.')
      setRequiresReadback(true)
      onSaved(response)
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) signOut()
      else { setError(failure.message); setRequiresReadback(true) }
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }
  return { save, pending, error, requiresReadback }
}
