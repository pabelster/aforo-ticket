import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/env.ts'
import { getPublicEvent, listManagedEvents, listPublicEvents } from '../services/events.ts'
import type { EventRow, PublicEvent } from '../types/database.ts'

export function usePublicEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    listPublicEvents()
      .then((rows) => {
        if (active) setEvents(rows)
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los eventos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { events, loading, error }
}

export function usePublicEvent(id: string | undefined) {
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [loading, setLoading] = useState(Boolean(id) && isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isSupabaseConfigured) return
    let active = true
    getPublicEvent(id)
      .then((row) => {
        if (active) setEvent(row)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el evento.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  return { event, loading, error }
}

export function useManagedEvents() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setEvents(await listManagedEvents())
      setError(null)
    } catch {
      setError('No se pudieron cargar los eventos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    listManagedEvents()
      .then((rows) => {
        if (!active) return
        setEvents(rows)
        setError(null)
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los eventos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { events, loading, error, setError, reload }
}
