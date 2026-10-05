import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { QrScanner } from '../components/scan/QrScanner.tsx'
import { Brand } from '../components/layout/Chrome.tsx'
import { Button } from '../components/ui/Button.tsx'
import { formatDateTime } from '../lib/format.ts'
import { playScanFeedback, unlockScanFeedback } from '../lib/scan-feedback.ts'
import { extractTicketToken } from '../lib/ticket-token.ts'
import { validateTicket } from '../services/tickets.ts'
import type { ScanResult } from '../types/database.ts'

type Phase = 'scanning' | 'checking' | 'done'

function outcomeTitle(result: ScanResult) {
  if (result.result === 'valid') return 'Entrada permitida'
  if (result.result === 'used') return 'Ticket ya utilizado'
  if (result.result === 'forbidden') return 'Sin permiso'
  return 'Ticket inválido'
}

function OutcomeScreen({
  tone,
  kicker,
  title,
  children,
  onAgain,
}: {
  tone: 'ok' | 'bad' | 'checking'
  kicker: string
  title: string
  children?: ReactNode
  onAgain?: () => void
}) {
  const node = (
    <div className={`scan-outcome scan-outcome-${tone}`} role={tone === 'checking' ? 'status' : 'alert'}>
      <p className="scan-outcome-kicker">{kicker}</p>
      <h1>{title}</h1>
      {children}
      {onAgain ? (
        <Button className="scan-outcome-btn" onClick={onAgain}>
          Escanear otro
        </Button>
      ) : null}
    </div>
  )
  return createPortal(node, document.body)
}

export function ScanPage() {
  const [phase, setPhase] = useState<Phase>('scanning')
  const [scanKey, setScanKey] = useState(0)
  const [outcome, setOutcome] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const busy = useRef(false)

  useEffect(() => {
    const unlock = () => {
      void unlockScanFeedback()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  useEffect(() => {
    const previous = document.body.style.overflow
    if (phase !== 'scanning') document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  async function handleScan(raw: string) {
    if (busy.current) return
    busy.current = true
    setPhase('checking')
    setCheckError(null)
    setOutcome(null)
    void unlockScanFeedback()

    const token = extractTicketToken(raw)
    if (!token) {
      setOutcome({ result: 'invalid' })
      setPhase('done')
      void playScanFeedback(false)
      return
    }

    try {
      const result = await validateTicket(token)
      setOutcome(result)
      setPhase('done')
      void playScanFeedback(result.result === 'valid')
    } catch {
      setOutcome(null)
      setCheckError('No se pudo consultar el boleto. Intenta de nuevo.')
      setPhase('done')
      void playScanFeedback(false)
    }
  }

  function scanAgain() {
    void unlockScanFeedback()
    busy.current = false
    setOutcome(null)
    setCheckError(null)
    setCameraError(null)
    setManual('')
    setPhase('scanning')
    setScanKey((current) => current + 1)
  }

  function submitManual(event: FormEvent) {
    event.preventDefault()
    void handleScan(manual)
  }

  return (
    <div className="scan">
      <header className="scan-bar">
        <Brand />
        <Link className="btn btn-ghost btn-sm" to="/admin">
          Panel
        </Link>
      </header>

      {phase === 'scanning' ? (
        <>
          <div className="scan-stage">
            <QrScanner
              key={scanKey}
              onScan={(value) => void handleScan(value)}
              onError={setCameraError}
            />
            <div className="scan-frame" />
          </div>
          <div className="scan-help stack">
            <p>
              {cameraError ??
                'Apunta al QR hasta llenar el recuadro. Toca la pantalla una vez para activar sonido y vibración.'}
            </p>
            <form className="manual-scan" onSubmit={submitManual}>
              <input
                className="input"
                value={manual}
                placeholder="O pega el token UUID del boleto"
                onChange={(event) => setManual(event.target.value)}
              />
              <Button type="submit" variant="ghost" disabled={!manual.trim()}>
                Validar
              </Button>
            </form>
          </div>
        </>
      ) : null}

      {phase === 'checking' ? (
        <OutcomeScreen tone="checking" kicker="Aforo" title="Consultando…" />
      ) : null}

      {phase === 'done' && checkError ? (
        <OutcomeScreen tone="bad" kicker="Aforo" title="Sin conexión" onAgain={scanAgain}>
          <p>{checkError}</p>
        </OutcomeScreen>
      ) : null}

      {phase === 'done' && outcome ? (
        <OutcomeScreen
          tone={outcome.result === 'valid' ? 'ok' : 'bad'}
          kicker={outcome.result === 'valid' || outcome.result === 'used' ? outcome.event_name : 'Aforo'}
          title={outcomeTitle(outcome)}
          onAgain={scanAgain}
        >
          {outcome.result === 'valid' || outcome.result === 'used' ? (
            <>
              <p className="scan-outcome-name">{outcome.attendee_name}</p>
              <p>Boleto {outcome.ticket_number}</p>
              <p>
                {outcome.result === 'valid' ? 'Hora de ingreso' : 'Primer ingreso'}:{' '}
                {outcome.used_at ? formatDateTime(outcome.used_at) : 'No disponible'}
              </p>
            </>
          ) : (
            <p>
              {outcome.result === 'forbidden'
                ? 'Esta cuenta no puede validar entradas.'
                : 'Este código no corresponde a un boleto.'}
            </p>
          )}
        </OutcomeScreen>
      ) : null}
    </div>
  )
}
