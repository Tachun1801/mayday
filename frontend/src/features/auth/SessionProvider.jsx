import { useCallback, useEffect, useMemo, useState } from 'react'
import { SessionContext } from './context.js'
import { createSession } from './session.js'

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)
  const signIn = useCallback((data) => setSession(createSession(data)), [])
  const updateUser = useCallback((user) => setSession((current) => current && (user?.staff_id || user?.patient_id) ? { ...current, user } : null), [])
  const signOut = useCallback(() => setSession(null), [])
  useEffect(() => {
    if (!session) return undefined
    const timer = setTimeout(signOut, Math.max(0, session.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [session, signOut])
  const value = useMemo(() => ({ session, signIn, signOut, updateUser }), [session, signIn, signOut, updateUser])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
