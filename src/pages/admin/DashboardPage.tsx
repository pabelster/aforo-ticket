import { useAuth } from '../../hooks/useAuth.ts'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <section>
      <div className="page-title">
        <div>
          <p className="kicker">Panel</p>
          <h1>Listo para el evento</h1>
        </div>
      </div>
      <article className="card stack">
        <p>
          Sesión activa como <strong>{user?.email}</strong>.
        </p>
        <p className="muted">
          Desde aquí vas a publicar eventos, revisar quién compró y escanear los QR en la puerta.
        </p>
      </article>
    </section>
  )
}
