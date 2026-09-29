import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
