import { useEffect, useState } from 'react'
import { requestApi } from './api/business.js'
import { useSession } from './session/context.js'

export function useResource(path) {
  const { session, signOut } = useSession()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const token = session?.token
  const key = `${path}:${attempt}:${token || ''}`
  useEffect(() => {
    const controller = new AbortController()
    requestApi(path, { token, signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setResult({ key, data }) })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (error.status === 401) signOut()
        else setResult({ key, error: error.message })
      })
    return () => controller.abort()
  }, [path, token, key, signOut])
  return {
    loading: result?.key !== key,
    data: result?.key === key ? result.data : null,
    error: result?.key === key ? result.error : null,
    retry: () => setAttempt((value) => value + 1),
  }
}
