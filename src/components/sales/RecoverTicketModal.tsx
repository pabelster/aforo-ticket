import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { TicketPass } from '../tickets/TicketPass.tsx'
import { Button } from '../ui/Button.tsx'
import { downloadTicketPng, downloadTicketsPdf } from '../../lib/ticket-file.ts'
import type { Attendee, IssuedTicket } from '../../types/database.ts'

function toIssued(row: Attendee): IssuedTicket {
  return {
    id: row.id,
    event_id: row.eventId,
    attendee_name: row.attendeeName,
    email: row.email,
    phone: row.phone,
    qr_token: row.qrToken,
    ticket_number: row.ticketNumber,
    status: row.status,
    purchase_date: row.purchaseDate,
    event_name: row.eventName,
    event_date: row.eventDate,
    start_time: row.startTime,
    location: row.location,
  }
}

export function RecoverTicketModal({
  attendee,
  onClose,
}: {
  attendee: Attendee
  onClose: () => void
}) {
  const ticket = toIssued(attendee)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void import('qrcode')
      .then(({ toDataURL }) =>
        toDataURL(ticket.qr_token, {
          margin: 1,
          width: 280,
          errorCorrectionLevel: 'M',
          color: { dark: '#1c1b17', light: '#ffffff' },
        }),
      )
      .then((url) => {
        if (active) setQrUrl(url)
      })
      .catch(() => {
        if (active) setError('No se pudo generar el QR del boleto.')
      })
    return () => {
      active = false
    }
  }, [ticket.qr_token])

  async function run(action: () => Promise<void>) {
    if (!qrUrl) return
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch {
      setError('No se pudo descargar el boleto.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-sheet stack"
        role="dialog"
        aria-modal="true"
        aria-label={`Boleto ${ticket.ticket_number}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="page-title">
          <div>
            <p className="kicker">Recuperar boleto</p>
            <h2>#{ticket.ticket_number}</h2>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {error ? <p className="banner">{error}</p> : null}
        <TicketPass ticket={ticket} qrUrl={qrUrl ?? undefined} />
        <div className="ticket-actions">
          <Button
            variant="ghost"
            disabled={busy || !qrUrl}
            onClick={() =>
              void run(() => downloadTicketPng(ticket, qrUrl!, `boleto-${ticket.ticket_number}.png`))
            }
          >
            PNG
          </Button>
          <Button
            variant="ghost"
            disabled={busy || !qrUrl}
            onClick={() =>
              void run(() =>
                downloadTicketsPdf([{ ticket, qrUrl: qrUrl! }], `boleto-${ticket.ticket_number}.pdf`),
              )
            }
          >
            PDF
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
