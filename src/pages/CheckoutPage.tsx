import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Chrome.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Field } from '../components/ui/Field.tsx'
import { formatPrice } from '../lib/format.ts'
import { saveOrder } from '../lib/order.ts'
import { usePublicEvent } from '../hooks/useEvents.ts'
import { describePurchaseError, purchaseTickets } from '../services/tickets.ts'

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function CheckoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { event, loading, error } = usePublicEvent(id)
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const lock = useRef(false)

  const max = event ? Math.min(10, event.remaining) : 1
  const total = event ? event.price * quantity : 0

  async function onSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()
    if (!event || lock.current) return

    const attendeeName = name.trim()
    const attendeeEmail = email.trim()
    if (attendeeName.length < 2) {
      setFormError('Escribe el nombre de quien asiste.')
      return
    }
    if (!emailPattern.test(attendeeEmail)) {
      setFormError('Escribe un correo válido.')
      return
    }
    if (phone.trim().length > 40) {
      setFormError('El teléfono es demasiado largo.')
      return
    }
    if (quantity < 1 || quantity > max) {
      setFormError('No hay suficientes lugares para esa cantidad.')
      return
    }

    lock.current = true
    setPending(true)
    setFormError(null)
    try {
      const tickets = await purchaseTickets({
        eventId: event.id,
        quantity,
        attendeeName,
        email: attendeeEmail,
        phone,
      })
      saveOrder(tickets)
      navigate('/boletos')
    } catch (caught) {
      setFormError(describePurchaseError(caught))
      lock.current = false
      setPending(false)
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="container hero">
        <Link className="kicker" to={id ? `/events/${id}` : '/'}>
          Volver al evento
        </Link>
        <h1>Tus boletos</h1>
        {loading ? <p className="muted">Cargando evento…</p> : null}
        {error ? <p className="banner">{error}</p> : null}
        {!loading && !error && !event ? <p className="muted">Este evento no está disponible.</p> : null}
        {event && event.remaining === 0 ? <p className="muted">Los boletos están agotados.</p> : null}
        {event && event.remaining > 0 ? (
          <form className="card stack checkout" onSubmit={(formEvent) => void onSubmit(formEvent)}>
            <div>
              <p className="kicker">{event.name}</p>
              <p className="muted">{formatPrice(event.price)} por boleto</p>
            </div>
            <div className="field">
              <span>Cantidad</span>
              <div className="stepper">
                <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1}>
                  −
                </button>
                <strong>{quantity}</strong>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(max, current + 1))}
                  disabled={quantity >= max}
                >
                  +
                </button>
              </div>
              <small className="faint">Máximo {max} en esta compra. Quedan {event.remaining}.</small>
            </div>
            <Field label="Nombre" name="attendee" autoComplete="name" required value={name} onChange={(input) => setName(input.target.value)} />
            <Field
              label="Correo"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(input) => setEmail(input.target.value)}
            />
            <Field
              label="Teléfono"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              hint="Opcional"
              value={phone}
              onChange={(input) => setPhone(input.target.value)}
            />
            <p className="total">
              <span>Total</span>
              <b>{formatPrice(total)}</b>
            </p>
            <p className="faint">El cobro es simulado. No se realiza ningún cargo.</p>
            {formError ? <p className="banner">{formError}</p> : null}
            <Button type="submit" block disabled={pending}>
              {pending ? 'Generando boletos…' : 'Pago completado'}
            </Button>
          </form>
        ) : null}
      </main>
    </>
  )
}
