import { formatEventDate, formatTime } from '../../lib/format.ts'
import type { IssuedTicket } from '../../types/database.ts'

export function TicketPass({
  ticket,
  qrUrl,
  onMount,
}: {
  ticket: IssuedTicket
  qrUrl?: string
  onMount: (node: HTMLElement | null) => void
}) {
  return (
    <article className="pass" ref={onMount}>
      <div className="pass-top">
        <p className="pass-kicker">Aforo</p>
        <h2>{ticket.event_name}</h2>
        <div className="pass-meta">
          <p>
            <span>Fecha</span>
            {formatEventDate(ticket.event_date)}
          </p>
          <p>
            <span>Hora</span>
            {formatTime(ticket.start_time)}
          </p>
          <p>
            <span>Lugar</span>
            {ticket.location}
          </p>
          <p>
            <span>Asistente</span>
            {ticket.attendee_name}
          </p>
        </div>
      </div>
      <div className="pass-tear" aria-hidden="true" />
      <div className="pass-bottom">
        <div>
          <p className="pass-kicker">Boleto</p>
          <p className="ticket-number">{ticket.ticket_number}</p>
        </div>
        <div className="qr">{qrUrl ? <img src={qrUrl} alt="Código QR del boleto" /> : null}</div>
      </div>
    </article>
  )
}
