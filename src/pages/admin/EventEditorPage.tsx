import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EventForm } from '../../components/events/EventForm.tsx'
import { createEvent, getManagedEvent, updateEvent } from '../../services/events.ts'
import type { EventInput } from '../../types/database.ts'

const blank: EventInput = {
  name: '',
  description: '',
  event_date: '',
  start_time: '',
  location: '',
  price: 0,
  capacity: 100,
  image_url: null,
  status: 'active',
}

export function EventEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [initial, setInitial] = useState<EventInput | null>(editing ? null : blank)
  const [missing, setMissing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    getManagedEvent(id)
      .then((event) => {
        if (!active) return
        if (!event) {
          setMissing(true)
          return
        }
        setInitial({
          name: event.name,
          description: event.description,
          event_date: event.event_date,
          start_time: event.start_time,
          location: event.location,
          price: event.price,
          capacity: event.capacity,
          image_url: event.image_url,
          status: event.status,
        })
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el evento.')
      })
    return () => {
      active = false
    }
  }, [id])

  async function save(input: EventInput) {
    setPending(true)
    setError(null)
    try {
      if (id) await updateEvent(id, input)
      else await createEvent(input)
      navigate('/admin/events')
    } catch {
      setError('No se pudo guardar el evento.')
      setPending(false)
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <p className="kicker">Eventos</p>
          <h1>{editing ? 'Editar evento' : 'Nuevo evento'}</h1>
        </div>
        <Link className="btn btn-ghost btn-sm" to="/admin/events">
          Volver
        </Link>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      {missing ? <p className="muted">Ese evento no existe.</p> : null}
      {!initial && !missing && !error ? <p className="muted">Cargando evento…</p> : null}
      {initial ? (
        <EventForm
          key={id ?? 'new'}
          initial={initial}
          pending={pending}
          submitLabel={editing ? 'Guardar cambios' : 'Publicar evento'}
          onSubmit={(input) => void save(input)}
        />
      ) : null}
    </section>
  )
}
