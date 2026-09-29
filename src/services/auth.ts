import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase.ts'

function mapAuthError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (normalized.includes('email not confirmed')) {
    return 'Confirma el correo del administrador antes de entrar.'
  }
  return 'No se pudo iniciar sesión. Revisa la conexión con Supabase.'
}

export async function fetchSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function watchSession(onChange: (session: Session | null) => void) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session)
  })
  return () => data.subscription.unsubscribe()
}

export async function signInAsStaff(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.'

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) return mapAuthError(error.message)

  const staff = await supabase.rpc('is_staff')
  if (staff.error || staff.data !== true) {
    await supabase.auth.signOut()
    if (staff.error) {
      return 'No se pudo verificar el acceso. Aplica la migración SQL en Supabase.'
    }
    return 'Esta cuenta no está autorizada como staff.'
  }

  return null
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
