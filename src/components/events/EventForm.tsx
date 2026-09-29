import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button.tsx'
import { Field, SelectField, TextArea } from '../ui/Field.tsx'
import type { EventInput, EventStatus } from '../../types/database.ts'

type Draft = {
  name: string
  description: string
  event_date: string
  start_time: string
  location: string
  price: string
  capacity: string
  image_url: string
  status: EventStatus
}

type Errors = Partial<Record<keyof Draft, string>>

function draftFrom(input: EventInput): Draft {
  return {
    name: input.name,
    description: input.description,
    event_date: input.event_date,
    start_time: input.start_time,
    location: input.location,
    price: String(input.price),
    capacity: String(input.capacity),
    image_url: input.image_url ?? '',
    status: input.status,
  }
}

function imageUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'invalid'
    return url.toString()
  } catch {
    return 'invalid'
  }
}

function validate(draft: Draft) {
  const errors: Errors = {}
  if (draft.name.trim().length < 2) errors.name = 'Escribe el nombre del evento.'
  if (!draft.event_date) errors.event_date = 'Elige la fecha.'
  if (!draft.start_time) errors.start_time = 'Elige la hora.'
  if (draft.location.trim().length < 2) errors.location = 'Escribe la ubicación.'

  const price = Number(draft.price)
  if (draft.price.trim() === '' || !Number.isFinite(price) || price < 0) {
    errors.price = 'Indica un precio válido, puede ser cero.'
  }

  const capacity = Number(draft.capacity)
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
    errors.capacity = 'La capacidad debe ser un entero mayor que cero.'
  }

  const image = imageUrl(draft.image_url)
  if (image === 'invalid') errors.image_url = 'Usa una URL http o https, o déjala vacía.'

  if (Object.keys(errors).length > 0 || image === 'invalid') return { errors }

  const input: EventInput = {
    name: draft.name.trim(),
    description: draft.description.trim(),
    event_date: draft.event_date,
    start_time: draft.start_time,
    location: draft.location.trim(),
    price: Math.round(price * 100) / 100,
    capacity,
    image_url: image,
    status: draft.status,
  }
  return { errors, input }
}

export function EventForm({
  initial,
  pending,
  submitLabel,
  onSubmit,
}: {
  initial: EventInput
  pending: boolean
  submitLabel: string
  onSubmit: (input: EventInput) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initial))
  const [errors, setErrors] = useState<Errors>({})

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = validate(draft)
    setErrors(result.errors)
    if (!result.input) return
    onSubmit(result.input)
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="span-2">
          <Field
            label="Nombre"
            name="name"
            required
            value={draft.name}
            error={errors.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </div>
        <div className="span-2">
          <TextArea
            label="Descripción"
            name="description"
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
          />
        </div>
        <Field
          label="Fecha"
          name="event_date"
          type="date"
          required
          value={draft.event_date}
          error={errors.event_date}
          onChange={(event) => update('event_date', event.target.value)}
        />
        <Field
          label="Hora"
          name="start_time"
          type="time"
          required
          value={draft.start_time}
          error={errors.start_time}
          onChange={(event) => update('start_time', event.target.value)}
        />
        <div className="span-2">
          <Field
            label="Ubicación"
            name="location"
            required
            value={draft.location}
            error={errors.location}
            onChange={(event) => update('location', event.target.value)}
          />
        </div>
        <Field
          label="Precio (MXN)"
          name="price"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          required
          value={draft.price}
          error={errors.price}
          onChange={(event) => update('price', event.target.value)}
        />
        <Field
          label="Capacidad"
          name="capacity"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          required
          value={draft.capacity}
          error={errors.capacity}
          onChange={(event) => update('capacity', event.target.value)}
        />
        <div className="span-2">
          <Field
            label="Imagen"
            name="image_url"
            type="url"
            inputMode="url"
            placeholder="https://"
            hint="Opcional. Pega el enlace de una imagen."
            value={draft.image_url}
            error={errors.image_url}
            onChange={(event) => update('image_url', event.target.value)}
          />
        </div>
        <SelectField
          label="Estado"
          name="status"
          value={draft.status}
          onChange={(value) => update('status', value === 'inactive' ? 'inactive' : 'active')}
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </SelectField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
