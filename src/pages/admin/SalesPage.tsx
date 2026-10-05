import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RecoverTicketModal } from '../../components/sales/RecoverTicketModal.tsx'
import { SelectField } from '../../components/ui/Field.tsx'
import { attendeesToCsv, downloadCsv } from '../../lib/csv.ts'
import { formatDateTime } from '../../lib/format.ts'
import { useSalesReport } from '../../hooks/useSales.ts'
import type { Attendee, TicketStatus } from '../../types/database.ts'

const filters: { id: 'all' | TicketStatus; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'unused', label: 'Sin usar' },
  { id: 'used', label: 'Usados' },
]

export function SalesPage() {
  const [params] = useSearchParams()
  const { attendees, events, loading, error } = useSalesReport()
  const [eventId, setEventId] = useState(() => params.get('evento') ?? 'all')
  const [status, setStatus] = useState<'all' | TicketStatus>('all')
  const [query, setQuery] = useState('')
  const [recover, setRecover] = useState<Attendee | null>(null)

  const selected = events.find((event) => event.id === eventId) ?? null
  const forEvent = eventId === 'all' ? attendees : attendees.filter((row) => row.eventId === eventId)
  const sold = forEvent.length
  const used = forEvent.filter((row) => row.status === 'used').length
  const needle = query.trim().toLowerCase()
  const visible = forEvent.filter((row) => {
    if (status !== 'all' && row.status !== status) return false
    if (!needle) return true
    return (
      row.attendeeName.toLowerCase().includes(needle) ||
      row.email.toLowerCase().includes(needle) ||
      row.ticketNumber.includes(needle)
    )
  })

  function exportCsv() {
    const slug = selected ? selected.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') : 'todos'
    downloadCsv(`asistentes-${slug || 'evento'}.csv`, attendeesToCsv(visible, formatDateTime))
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <p className="kicker">Ventas</p>
          <h1>Asistentes</h1>
        </div>
        <button className="btn btn-primary btn-sm" type="button" disabled={visible.length === 0} onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      {loading ? <p className="muted">Cargando ventas…</p> : null}
      {!loading && !error ? (
        <div className="stack">
          <SelectField label="Evento" name="event" value={eventId} onChange={setEventId}>
            <option value="all">Todos los eventos</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </SelectField>
          <div className="stats">
            <article className="card stat">
              <span className="muted">Vendidos</span>
              <b>{sold}</b>
            </article>
            <article className="card stat">
              <span className="muted">Ingresaron</span>
              <b>{used}</b>
            </article>
            <article className="card stat">
              <span className="muted">Pendientes</span>
              <b>{sold - used}</b>
            </article>
            <article className="card stat">
              <span className="muted">{selected ? 'Lugares libres' : 'Eventos'}</span>
              <b>{selected ? Math.max(0, selected.capacity - sold) : events.length}</b>
            </article>
          </div>
          <div className="filters" role="group" aria-label="Estado del boleto">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={status === filter.id ? 'chip active' : 'chip'}
                type="button"
                onClick={() => setStatus(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Buscar</span>
            <input
              className="input"
              value={query}
              placeholder="Nombre, correo o número"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {visible.length === 0 ? (
            <div className="card empty">
              <p>No hay asistentes con ese filtro.</p>
            </div>
          ) : (
            <div className="list">
              {visible.map((row) => (
                <article key={row.id} className="person">
                  <div>
                    <h3>{row.attendeeName}</h3>
                    <p className="meta">
                      {row.eventName} · Boleto {row.ticketNumber}
                    </p>
                    <p className="meta">
                      {row.email}
                      {row.phone ? ` · ${row.phone}` : ''}
                    </p>
                    <p className="faint">
                      Compra {formatDateTime(row.purchaseDate)}
                      {row.usedAt ? ` · Ingreso ${formatDateTime(row.usedAt)}` : ''}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setRecover(row)}>
                      Boleto
                    </button>
                    <span className={row.status === 'used' ? 'pill pill-ok' : 'pill'}>
                      {row.status === 'used' ? 'Usado' : 'Sin usar'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {recover ? <RecoverTicketModal attendee={recover} onClose={() => setRecover(null)} /> : null}
    </section>
  )
}
