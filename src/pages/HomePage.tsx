import { Link } from 'react-router-dom'
import { EventCard } from '../components/events/EventCard.tsx'
import { PublicHeader } from '../components/layout/Chrome.tsx'
import { SetupGuide } from '../components/ui/SetupGuide.tsx'
import { usePublicEvents } from '../hooks/useEvents.ts'
import { useAuth } from '../hooks/useAuth.ts'

const steps = [
  {
    n: '01',
    title: 'Vende',
    text: 'El asistente elige el evento, indica cuántos boletos quiere y deja sus datos.',
  },
  {
    n: '02',
    title: 'Entrega',
    text: 'Cada boleto lleva un QR con un token único. El código no contiene nombre, correo ni teléfono.',
  },
  {
    n: '03',
    title: 'Valida',
    text: 'En la puerta el staff lo escanea una vez. Si el mismo QR vuelve a aparecer, la entrada se rechaza.',
  },
]

export function HomePage() {
  const { configured } = useAuth()
  const { events, loading, error } = usePublicEvents()

  return (
    <>
      <PublicHeader />
      <main className="container hero">
        <p className="kicker">Control de acceso</p>
        <h1>Un boleto. Un ingreso.</h1>
        <p className="lead">
          Aforo vende entradas para tus eventos y marca cada QR como usado en el momento del escaneo, para que nadie
          entre dos veces con el mismo código.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#cartelera">
            Ver eventos
          </a>
          <Link className="btn btn-ghost" to="/login">
            Entrar como staff
          </Link>
        </div>
        <section className="step-grid" aria-label="Cómo funciona">
          {steps.map((step) => (
            <article key={step.n} className="card step">
              <span className="kicker">{step.n}</span>
              <h2>{step.title}</h2>
              <p className="muted">{step.text}</p>
            </article>
          ))}
        </section>
        {configured ? (
          <section className="catalog" id="cartelera">
            <div className="page-title">
              <h2>En cartelera</h2>
            </div>
            {loading ? <p className="muted">Cargando eventos…</p> : null}
            {error ? <p className="banner">{error}</p> : null}
            {!loading && !error && events.length === 0 ? (
              <p className="muted">Todavía no hay eventos publicados.</p>
            ) : null}
            {!loading && !error && events.length > 0 ? (
              <div className="event-grid">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <div className="setup-wrap">
            <SetupGuide />
          </div>
        )}
      </main>
    </>
  )
}
