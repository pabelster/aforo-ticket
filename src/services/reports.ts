import { requireSupabase } from '../lib/supabase.ts'
import type { Attendee, SalesOverview, TicketStatus } from '../types/database.ts'

type RawAttendee = {
  id: string
  event_id: string
  attendee_name: string
  email: string
  phone: string | null
  ticket_number: string
  status: string
  purchase_date: string
  used_at: string | null
  events: { name: string } | { name: string }[] | null
}

function eventName(events: RawAttendee['events']) {
  if (Array.isArray(events)) return events[0]?.name ?? 'Evento'
  return events?.name ?? 'Evento'
}

function asStatus(value: string): TicketStatus {
  return value === 'used' ? 'used' : 'unused'
}

export async function loadOverview(): Promise<SalesOverview> {
  const client = requireSupabase()
  const [events, tickets] = await Promise.all([
    client.from('events').select('id', { count: 'exact', head: true }),
    client.from('tickets').select('status'),
  ])
  if (events.error) throw events.error
  if (tickets.error) throw tickets.error

  const sold = tickets.data?.length ?? 0
  const used = tickets.data?.filter((row) => row.status === 'used').length ?? 0
  return {
    events: events.count ?? 0,
    sold,
    used,
    pending: sold - used,
  }
}

export async function listAttendees() {
  const { data, error } = await requireSupabase()
    .from('tickets')
    .select('id, event_id, attendee_name, email, phone, ticket_number, status, purchase_date, used_at, events(name)')
    .order('purchase_date', { ascending: false })
  if (error) throw error

  return ((data ?? []) as RawAttendee[]).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventName: eventName(row.events),
    attendeeName: row.attendee_name,
    email: row.email,
    phone: row.phone,
    ticketNumber: row.ticket_number,
    status: asStatus(row.status),
    purchaseDate: row.purchase_date,
    usedAt: row.used_at,
  })) satisfies Attendee[]
}
