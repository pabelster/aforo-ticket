import type { IssuedTicket } from '../types/database.ts'

const ORDER_KEY = 'aforo:order'

function isTicket(value: unknown): value is IssuedTicket {
  if (!value || typeof value !== 'object') return false
  const ticket = value as Partial<IssuedTicket>
  return (
    typeof ticket.id === 'string' &&
    typeof ticket.qr_token === 'string' &&
    typeof ticket.ticket_number === 'string' &&
    typeof ticket.event_name === 'string' &&
    typeof ticket.attendee_name === 'string'
  )
}

export function saveOrder(tickets: IssuedTicket[]) {
  sessionStorage.setItem(ORDER_KEY, JSON.stringify(tickets))
}

export function readOrder() {
  const raw = sessionStorage.getItem(ORDER_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isTicket)) return null
    return parsed
  } catch {
    return null
  }
}
