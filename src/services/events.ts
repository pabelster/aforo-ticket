import { requireSupabase } from '../lib/supabase.ts'
import type { EventInput, EventRow, EventStatus, PublicEvent } from '../types/database.ts'

type RawEvent = {
  id: string
  name: string
  description: string | null
  event_date: string
  start_time: string
  location: string
  price: number | string
  capacity: number | string
  image_url: string | null
  status: string
  created_at: string
  updated_at: string
  remaining?: number | string
}

function asNumber(value: number | string | undefined) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

function asStatus(value: string): EventStatus {
  return value === 'inactive' ? 'inactive' : 'active'
}

function mapEvent(row: RawEvent): EventRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    event_date: row.event_date.slice(0, 10),
    start_time: row.start_time.slice(0, 5),
    location: row.location,
    price: asNumber(row.price),
    capacity: asNumber(row.capacity),
    image_url: row.image_url,
    status: asStatus(row.status),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapPublic(row: RawEvent): PublicEvent {
  return {
    ...mapEvent(row),
    remaining: Math.max(0, asNumber(row.remaining)),
  }
}

function toPayload(input: EventInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    event_date: input.event_date,
    start_time: input.start_time,
    location: input.location.trim(),
    price: input.price,
    capacity: input.capacity,
    image_url: input.image_url,
    status: input.status,
  }
}

export function describeEventError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23503') {
    return 'No puedes eliminar un evento que ya tiene boletos vendidos.'
  }
  return 'No se pudo completar la operación.'
}

export async function listPublicEvents() {
  const { data, error } = await requireSupabase().rpc('list_public_events')
  if (error) throw error
  return ((data ?? []) as RawEvent[]).map(mapPublic)
}

export async function getPublicEvent(id: string) {
  const { data, error } = await requireSupabase().rpc('get_public_event', { p_event_id: id })
  if (error) throw error
  const row = ((data ?? []) as RawEvent[])[0]
  return row ? mapPublic(row) : null
}

export async function listManagedEvents() {
  const { data, error } = await requireSupabase()
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return ((data ?? []) as RawEvent[]).map(mapEvent)
}

export async function getManagedEvent(id: string) {
  const { data, error } = await requireSupabase().from('events').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapEvent(data as RawEvent) : null
}

export async function createEvent(input: EventInput) {
  const { data, error } = await requireSupabase().from('events').insert(toPayload(input)).select('*').single()
  if (error) throw error
  return mapEvent(data as RawEvent)
}

export async function updateEvent(id: string, input: EventInput) {
  const { data, error } = await requireSupabase()
    .from('events')
    .update(toPayload(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapEvent(data as RawEvent)
}

export async function deleteEvent(id: string) {
  const { error } = await requireSupabase().from('events').delete().eq('id', id)
  if (error) throw error
}
