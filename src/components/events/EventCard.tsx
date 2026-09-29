import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { coverHue, formatEventDate, formatPrice, formatTime } from '../../lib/format.ts'
import type { PublicEvent } from '../../types/database.ts'

export function EventCard({ event }: { event: PublicEvent }) {
  const style: CSSProperties = { backgroundImage: coverHue(event.name) }
  return (
    <Link className="card event-card" to={`/events/${event.id}`}>
      <div className="event-cover" style={style}>
        {event.image_url ? <img src={event.image_url} alt="" /> : null}
      </div>
      <div className="event-body">
        <span className={event.remaining === 0 ? 'pill pill-bad' : 'pill pill-lime'}>
          {event.remaining === 0 ? 'Agotado' : `${event.remaining} disponibles`}
        </span>
        <h2>{event.name}</h2>
        <p className="meta">
          {formatEventDate(event.event_date)} · {formatTime(event.start_time)}
        </p>
        <p className="meta">{event.location}</p>
        <p className="price">{formatPrice(event.price)}</p>
      </div>
    </Link>
  )
}
