import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TicketPass } from '../components/tickets/TicketPass.tsx'
import { PublicHeader } from '../components/layout/Chrome.tsx'
import { Button } from '../components/ui/Button.tsx'
import { readOrder } from '../lib/order.ts'
import { downloadTicketPng, downloadTicketsPdf } from '../lib/ticket-file.ts'

export function TicketsPage() {
  const [tickets] = useState(() => readOrder())
  const nodes = useRef(new Map<string, HTMLElement>())
  const [qrs, setQrs] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!tickets) return
    let active = true
    void import('qrcode')
      .then(({ toDataURL }) =>
        Promise.all(
          tickets.map(async (ticket) => {
            const url = await toDataURL(ticket.qr_token, {
              margin: 1,
              width: 280,
              errorCorrectionLevel: 'M',
              color: { dark: '#1c1b17', light: '#ffffff' },
            })
            return [ticket.id, url] as const
          }),
        ),
      )
      .then((pairs) => {
        if (active) setQrs(Object.fromEntries(pairs))
      })
      .catch(() => {
        if (active) setError('No se pudieron generar los códigos QR.')
      })
    return () => {
      active = false
    }
  }, [tickets])

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key)
    setError(null)
    try {
      await action()
    } catch {
      setError('No se pudo descargar el boleto.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="container hero">
        <p className="kicker">Compra lista</p>
        <h1>Tus entradas</h1>
        {!tickets ? (
          <div className="card stack">
            <p>No hay boletos en esta sesión.</p>
            <Link className="btn btn-primary" to="/">
              Ver eventos
            </Link>
          </div>
        ) : (
          <div className="stack">
            <p className="muted">
              Cada QR contiene solo un token. Descarga los boletos antes de cerrar el navegador.
            </p>
            {error ? <p className="banner">{error}</p> : null}
            {tickets.length > 1 ? (
              <Button
                variant="ghost"
                disabled={busy !== null}
                onClick={() =>
                  void run('all', () =>
                    downloadTicketsPdf(
                      tickets.flatMap((ticket) => {
                        const node = nodes.current.get(ticket.id)
                        return node ? [node] : []
                      }),
                      'boletos-aforo.pdf',
                    ),
                  )
                }
              >
                {busy === 'all' ? 'Preparando PDF…' : 'Descargar todos en PDF'}
              </Button>
            ) : null}
            {tickets.map((ticket) => (
              <section key={ticket.id} className="stack">
                <TicketPass
                  ticket={ticket}
                  qrUrl={qrs[ticket.id]}
                  onMount={(node) => {
                    if (node) nodes.current.set(ticket.id, node)
                    else nodes.current.delete(ticket.id)
                  }}
                />
                <div className="ticket-actions">
                  <Button
                    variant="ghost"
                    disabled={busy !== null || !qrs[ticket.id]}
                    onClick={() => {
                      const node = nodes.current.get(ticket.id)
                      if (!node) return
                      void run(ticket.id, () => downloadTicketPng(node, `boleto-${ticket.ticket_number}.png`))
                    }}
                  >
                    PNG
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy !== null || !qrs[ticket.id]}
                    onClick={() => {
                      const node = nodes.current.get(ticket.id)
                      if (!node) return
                      void run(`${ticket.id}-pdf`, () =>
                        downloadTicketsPdf([node], `boleto-${ticket.ticket_number}.pdf`),
                      )
                    }}
                  >
                    PDF
                  </Button>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
