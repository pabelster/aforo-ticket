import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatEventDate, formatPrice, formatTime } from '../../lib/format.ts'
import { deleteEvent, describeEventError } from '../../services/events.ts'
import { useManagedEvents } from '../../hooks/useEvents.ts'
import type { EventRow } from '../../types/database.ts'

export function EventsAdminPage() {
  const { events, loading, error, setError, reload } = useManagedEvents()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function remove(event: EventRow) {
    setDeleting(true)
    try {
      await deleteEvent(event.id)
      setConfirmId(null)
      await reload()
    } catch (caught) {
      setError(describeEventError(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <p className="kicker">Eventos</p>
          <h1>Cartelera</h1>
        </div>
        <Link className="btn btn-primary btn-sm" to="/admin/events/new">
          Nuevo evento
        </Link>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      {loading ? <p className="muted">Cargando eventos…</p> : null}
      {!loading && events.length === 0 ? (
        <div className="card empty">
          <p>Todavía no hay eventos.</p>
        </div>
      ) : null}
      {events.length > 0 ? (
        <div className="list">
          {events.map((event) => (
            <article key={event.id} className="person">
              <div>
                <h3>{event.name}</h3>
                <p className="meta">
                  {formatEventDate(event.event_date)} · {formatTime(event.start_time)} · {event.location}
                </p>
                <p className="meta">
                  {formatPrice(event.price)} · {event.capacity} lugares
                </p>
              </div>
              <div className="row-actions">
                <span className={event.status === 'active' ? 'pill pill-ok' : 'pill'}>
                  {event.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
                <Link className="btn btn-ghost btn-sm" to={`/admin/ventas?evento=${event.id}`}>
                  Ventas
                </Link>
                <Link className="btn btn-ghost btn-sm" to={`/admin/events/${event.id}`}>
                  Editar
                </Link>
                {confirmId === event.id ? (
                  <button
                    className="btn btn-danger btn-sm"
                    type="button"
                    disabled={deleting}
                    onClick={() => void remove(event)}
                  >
                    {deleting ? 'Eliminando…' : 'Confirmar'}
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirmId(event.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
