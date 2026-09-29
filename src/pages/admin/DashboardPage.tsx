import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import { useOverview } from '../../hooks/useSales.ts'

export function DashboardPage() {
  const { user } = useAuth()
  const { counts, loading, error } = useOverview()

  return (
    <section>
      <div className="page-title">
        <div>
          <p className="kicker">Panel</p>
          <h1>Listo para el evento</h1>
        </div>
      </div>
      <div className="stack">
        <article className="card stack">
          <p>
            Sesión activa como <strong>{user?.email}</strong>.
          </p>
          <p className="muted">Publica la cartelera, revisa quién compró y escanea los QR en la puerta.</p>
          <div className="row-actions">
            <Link className="btn btn-primary" to="/admin/events/new">
              Crear evento
            </Link>
            <Link className="btn btn-ghost" to="/admin/ventas">
              Ver ventas
            </Link>
            <Link className="btn btn-ghost" to="/scan">
              Escanear entradas
            </Link>
          </div>
        </article>
        {error ? <p className="banner">{error}</p> : null}
        <div className="stats">
          <article className="card stat">
            <span className="muted">Eventos</span>
            <b>{loading ? '…' : counts.events}</b>
          </article>
          <article className="card stat">
            <span className="muted">Vendidos</span>
            <b>{loading ? '…' : counts.sold}</b>
          </article>
          <article className="card stat">
            <span className="muted">Ingresaron</span>
            <b>{loading ? '…' : counts.used}</b>
          </article>
          <article className="card stat">
            <span className="muted">Pendientes</span>
            <b>{loading ? '…' : counts.pending}</b>
          </article>
        </div>
      </div>
    </section>
  )
}
