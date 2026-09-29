import { Link, useParams } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Chrome.tsx'
import { coverHue, formatEventDate, formatPrice, formatTime } from '../lib/format.ts'
import { usePublicEvent } from '../hooks/useEvents.ts'

export function EventDetailPage() {
  const { id } = useParams()
  const { event, loading, error } = usePublicEvent(id)

  return (
    <>
      <PublicHeader />
      <main className="container hero">
        <Link className="kicker" to="/#cartelera">
          Cartelera
        </Link>
        {loading ? <p className="muted">Cargando evento…</p> : null}
        {error ? <p className="banner">{error}</p> : null}
        {!loading && !error && !event ? <p className="muted">Este evento no está disponible.</p> : null}
        {event ? (
          <article className="detail">
            <div className="event-cover detail-cover" style={{ backgroundImage: coverHue(event.name) }}>
              {event.image_url ? <img src={event.image_url} alt="" /> : null}
            </div>
            <p className="kicker">{event.remaining === 0 ? 'Agotado' : `${event.remaining} lugares disponibles`}</p>
            <h1>{event.name}</h1>
            <p className="lead">
              {formatEventDate(event.event_date)} · {formatTime(event.start_time)}
              <br />
              {event.location}
            </p>
            {event.description ? <p className="prose">{event.description}</p> : null}
            <p className="total">
              <span className="muted">Precio por boleto</span>
              <b>{formatPrice(event.price)}</b>
            </p>
          </article>
        ) : null}
      </main>
    </>
  )
}
