import { requireSupabase } from '../lib/supabase.ts'
import type { Attendee, SalesOverview, TicketStatus } from '../types/database.ts'

type RawAttendee = {
  id: string
  event_id: string
  attendee_name: string
  email: string
  phone: string | null
  qr_token: string
  ticket_number: string
  status: string
  purchase_date: string
  used_at: string | null
  events:
    | {
        name: string
        event_date: string
        start_time: string
        location: string
      }
    | {
        name: string
        event_date: string
        start_time: string
        location: string
      }[]
    | null
}

function eventInfo(events: RawAttendee['events']) {
  const row = Array.isArray(events) ? events[0] : events
  return {
    eventName: row?.name ?? 'Evento',
    eventDate: row?.event_date?.slice(0, 10) ?? '',
    startTime: row?.start_time?.slice(0, 5) ?? '',
    location: row?.location ?? '',
  }
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
    .select(
      'id, event_id, attendee_name, email, phone, qr_token, ticket_number, status, purchase_date, used_at, events(name, event_date, start_time, location)',
    )
    .order('purchase_date', { ascending: false })
  if (error) throw error

  return ((data ?? []) as RawAttendee[]).map((row) => {
    const event = eventInfo(row.events)
    return {
      id: row.id,
      eventId: row.event_id,
      eventName: event.eventName,
      eventDate: event.eventDate,
      startTime: event.startTime,
      location: event.location,
      attendeeName: row.attendee_name,
      email: row.email,
      phone: row.phone,
      qrToken: row.qr_token,
      ticketNumber: row.ticket_number,
      status: asStatus(row.status),
      purchaseDate: row.purchase_date,
      usedAt: row.used_at,
    }
  }) satisfies Attendee[]
}
