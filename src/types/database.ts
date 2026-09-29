export type EventStatus = 'active' | 'inactive'
export type TicketStatus = 'unused' | 'used'

export type EventRow = {
  id: string
  name: string
  description: string
  event_date: string
  start_time: string
  location: string
  price: number
  capacity: number
  image_url: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

export type EventInput = {
  name: string
  description: string
  event_date: string
  start_time: string
  location: string
  price: number
  capacity: number
  image_url: string | null
  status: EventStatus
}

export type PublicEvent = {
  id: string
  name: string
  description: string
  event_date: string
  start_time: string
  location: string
  price: number
  capacity: number
  image_url: string | null
  status: EventStatus
  remaining: number
}

export type TicketRow = {
  id: string
  event_id: string
  attendee_name: string
  email: string
  phone: string | null
  qr_token: string
  ticket_number: string
  status: TicketStatus
  purchase_date: string
  used_at: string | null
}

export type IssuedTicket = {
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

export type PurchaseInput = {
  eventId: string
  quantity: number
  attendeeName: string
  email: string
  phone: string
}

export type ScanResult =
  | {
      result: 'valid' | 'used'
      attendee_name: string
      ticket_number: string
      event_name: string
      used_at: string
    }
  | { result: 'invalid' }
  | { result: 'forbidden' }

export type Attendee = {
  id: string
  eventId: string
  eventName: string
  attendeeName: string
  email: string
  phone: string | null
  ticketNumber: string
  status: TicketStatus
  purchaseDate: string
  usedAt: string | null
}

export type SalesOverview = {
  events: number
  sold: number
  used: number
  pending: number
}
