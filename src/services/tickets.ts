import { requireSupabase } from '../lib/supabase.ts'
import type { IssuedTicket, PurchaseInput, TicketStatus } from '../types/database.ts'

const purchaseMessages: Record<string, string> = {
  INVALID_QUANTITY: 'Elige entre 1 y 10 boletos.',
  INVALID_NAME: 'Escribe el nombre de quien asiste.',
  INVALID_EMAIL: 'Escribe un correo válido.',
  INVALID_PHONE: 'El teléfono es demasiado largo.',
  EVENT_NOT_FOUND: 'Ese evento ya no existe.',
  EVENT_INACTIVE: 'Este evento no está a la venta.',
  SOLD_OUT: 'No hay suficientes lugares disponibles.',
}

type RawTicket = {
  id: string
  event_id: string
  attendee_name: string
  email: string
  phone: string | null
  qr_token: string
  ticket_number: string
  status: TicketStatus
  purchase_date: string
  event_name: string
  event_date: string
  start_time: string
  location: string
}

function mapIssued(row: RawTicket): IssuedTicket {
  return {
    id: row.id,
    event_id: row.event_id,
    attendee_name: row.attendee_name,
    email: row.email,
    phone: row.phone,
    qr_token: row.qr_token,
    ticket_number: row.ticket_number,
    status: row.status === 'used' ? 'used' : 'unused',
    purchase_date: row.purchase_date,
    event_name: row.event_name,
    event_date: String(row.event_date).slice(0, 10),
    start_time: String(row.start_time).slice(0, 5),
    location: row.location,
  }
}

export function describePurchaseError(error: unknown) {
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  for (const [code, text] of Object.entries(purchaseMessages)) {
    if (message.includes(code)) return text
  }
  return 'No se pudo completar la compra.'
}

export async function purchaseTickets(input: PurchaseInput) {
  const { data, error } = await requireSupabase().rpc('purchase_tickets', {
    p_event_id: input.eventId,
    p_quantity: input.quantity,
    p_attendee_name: input.attendeeName,
    p_email: input.email,
    p_phone: input.phone.trim() || null,
  })
  if (error) throw error

  const payload = typeof data === 'string' ? (JSON.parse(data) as unknown) : data
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('EMPTY_ORDER')
  }
  return payload.map((row) => mapIssued(row as RawTicket))
}
