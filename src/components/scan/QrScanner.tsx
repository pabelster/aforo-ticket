import { useEffect, useRef } from 'react'

type Html5Scanner = {
  isScanning: boolean
  start: (
    camera: MediaTrackConstraints,
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decoded: string) => void,
    onError: () => void,
  ) => Promise<unknown>
  stop: () => Promise<void>
  clear: () => void
}

let cameraQueue: Promise<void> = Promise.resolve()

function cameraMessage(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  const normalized = text.toLowerCase()
  if (normalized.includes('notallowed') || normalized.includes('permission')) {
    return 'Permite el uso de la cámara para validar entradas.'
  }
  if (!window.isSecureContext) {
    return 'La cámara necesita HTTPS. Ábrela en localhost o en un sitio seguro.'
  }
  return 'No se pudo abrir la cámara.'
}

export function QrScanner({
  onScan,
  onError,
}: {
  onScan: (value: string) => void
  onError: (message: string) => void
}) {
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  })

  useEffect(() => {
    let cancelled = false
    let reported = false
    let scanner: Html5Scanner | null = null

    const run = cameraQueue.then(async () => {
      if (cancelled) return
      const { Html5Qrcode } = await import('html5-qrcode')
      if (cancelled) return
      const instance = new Html5Qrcode('qr-reader', { verbose: false })
      scanner = instance
      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (reported) return
          reported = true
          onScanRef.current(decoded)
        },
        () => {},
      )
      if (cancelled && instance.isScanning) {
        await instance.stop()
        instance.clear()
      }
    })

    cameraQueue = run.then(
      () => undefined,
      () => undefined,
    )

    void run.catch((error: unknown) => {
      if (!cancelled) onErrorRef.current(cameraMessage(error))
    })

    return () => {
      cancelled = true
      cameraQueue = cameraQueue.then(async () => {
        if (!scanner?.isScanning) return
        await scanner.stop()
        scanner.clear()
      }, async () => {
        if (!scanner?.isScanning) return
        await scanner.stop()
        scanner.clear()
      })
    }
  }, [])

  return <div id="qr-reader" />
}
