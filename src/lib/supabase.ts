import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './env.ts'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }
  return supabase
}
