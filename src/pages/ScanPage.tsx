import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QrScanner } from '../components/scan/QrScanner.tsx'
import { Brand } from '../components/layout/Chrome.tsx'
import { Button } from '../components/ui/Button.tsx'
import { formatDateTime } from '../lib/format.ts'
import { extractTicketToken } from '../lib/ticket-token.ts'
import { validateTicket } from '../services/tickets.ts'
import type { ScanResult } from '../types/database.ts'

type Phase = 'scanning' | 'checking' | 'done'

function outcomeClass(result: ScanResult['result']) {
  return result === 'valid' ? 'ok' : 'bad'
}

function outcomeTitle(result: ScanResult) {
  if (result.result === 'valid') return 'Entrada permitida'
  if (result.result === 'used') return 'Ticket ya utilizado'
  if (result.result === 'forbidden') return 'Sin permiso'
  return 'Ticket inválido'
}

export function ScanPage() {
  const [phase, setPhase] = useState<Phase>('scanning')
  const [outcome, setOutcome] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

  async function handleScan(raw: string) {
    setPhase('checking')
    setCheckError(null)
    const token = extractTicketToken(raw)
    if (!token) {
      setOutcome({ result: 'invalid' })
      setPhase('done')
      return
    }

    try {
      setOutcome(await validateTicket(token))
      setPhase('done')
    } catch {
      setOutcome(null)
      setCheckError('No se pudo consultar el boleto. Intenta de nuevo.')
      setPhase('done')
    }
  }

  function scanAgain() {
    setOutcome(null)
    setCheckError(null)
    setCameraError(null)
    setPhase('scanning')
  }

  return (
    <div className="scan">
      <header className="scan-bar">
        <Brand />
        <Link className="btn btn-ghost btn-sm" to="/admin">
          Panel
        </Link>
      </header>
      <div className="scan-stage">
        {phase === 'scanning' ? (
          <>
            <QrScanner onScan={(value) => void handleScan(value)} onError={setCameraError} />
            <div className="scan-frame" />
          </>
        ) : null}
        {phase === 'checking' ? (
          <div className="scan-result">
            <h2>Consultando…</h2>
          </div>
        ) : null}
        {phase === 'done' && checkError ? (
          <div className="scan-result bad">
            <h2>Sin conexión</h2>
            <p>{checkError}</p>
            <Button onClick={scanAgain}>Escanear otro</Button>
          </div>
        ) : null}
        {phase === 'done' && outcome ? (
          <div className={`scan-result ${outcomeClass(outcome.result)}`}>
            <p className="pass-kicker">{outcome.result === 'valid' || outcome.result === 'used' ? outcome.event_name : 'Aforo'}</p>
            <h2>{outcomeTitle(outcome)}</h2>
            {outcome.result === 'valid' || outcome.result === 'used' ? (
              <>
                <p>{outcome.attendee_name}</p>
                <p>Boleto {outcome.ticket_number}</p>
                <p>
                  {outcome.result === 'valid' ? 'Hora de ingreso' : 'Primer ingreso'}:{' '}
                  {outcome.used_at ? formatDateTime(outcome.used_at) : 'No disponible'}
                </p>
              </>
            ) : (
              <p>{outcome.result === 'forbidden' ? 'Esta cuenta no puede validar entradas.' : 'Este código no corresponde a un boleto.'}</p>
            )}
            <Button onClick={scanAgain}>Escanear otro</Button>
          </div>
        ) : null}
      </div>
      {phase === 'scanning' ? (
        <p className="scan-help">{cameraError ?? 'Apunta la cámara al QR del boleto.'}</p>
      ) : null}
    </div>
  )
}
