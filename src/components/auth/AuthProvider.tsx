import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../../lib/env.ts'
import { AuthContext, type AuthState } from '../../lib/auth-context.ts'
import { fetchSession, signInAsStaff, signOut as logOut, watchSession } from '../../services/auth.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    void fetchSession().then((next) => {
      if (!active) return
      setSession(next)
      setLoading(false)
    })

    const unsubscribe = watchSession((next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback((email: string, password: string) => signInAsStaff(email, password), [])
  const signOut = useCallback(() => logOut(), [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
