import { useEffect, useState } from 'react'
import { listManagedEvents } from '../services/events.ts'
import { listAttendees, loadOverview } from '../services/reports.ts'
import type { Attendee, EventRow, SalesOverview } from '../types/database.ts'

const emptyOverview: SalesOverview = { events: 0, sold: 0, used: 0, pending: 0 }

export function useOverview() {
  const [counts, setCounts] = useState<SalesOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadOverview()
      .then((next) => {
        if (active) setCounts(next)
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar las ventas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { counts, loading, error }
}

export function useSalesReport() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listAttendees(), listManagedEvents()])
      .then(([people, catalog]) => {
        if (!active) return
        setAttendees(people)
        setEvents(catalog)
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar las ventas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { attendees, events, loading, error }
}
