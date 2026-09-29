import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import { LoadingScreen } from '../ui/LoadingScreen.tsx'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, configured } = useAuth()
  const location = useLocation()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <LoadingScreen />
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
