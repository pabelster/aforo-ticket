import { Link } from 'react-router-dom'
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
          Publica la cartelera, revisa quién compró y escanea los QR en la puerta.
        </p>
        <div className="row-actions">
          <Link className="btn btn-primary" to="/admin/events/new">
            Crear evento
          </Link>
          <Link className="btn btn-ghost" to="/scan">
            Escanear entradas
          </Link>
        </div>
      </article>
    </section>
  )
}
