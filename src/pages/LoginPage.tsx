import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/layout/Chrome.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Field } from '../components/ui/Field.tsx'
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx'
import { SetupGuide } from '../components/ui/SetupGuide.tsx'
import { useAuth } from '../hooks/useAuth.ts'

function destinationFrom(state: unknown) {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/admin'
  const from = state.from
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return '/admin'
  return from
}

export function LoginPage() {
  const { configured, loading, session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = destinationFrom(location.state)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (loading) return <LoadingScreen />
  if (session) return <Navigate to={destination} replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const message = await signIn(email, password)
    setPending(false)
    if (message) {
      setError(message)
      return
    }
    navigate(destination, { replace: true })
  }

  return (
    <main className="login">
      <Brand />
      <div className="login-copy">
        <h1>Acceso de staff</h1>
        <p className="muted">Solo las cuentas registradas como staff pueden crear eventos y validar entradas.</p>
      </div>
      {configured ? (
        <form className="card stack" onSubmit={(event) => void onSubmit(event)}>
          <Field
            label="Correo"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="banner">{error}</p> : null}
          <Button type="submit" block disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      ) : (
        <SetupGuide />
      )}
    </main>
  )
}
