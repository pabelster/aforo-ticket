import { useEffect, useId, useRef } from 'react'

type Html5Scanner = {
  isScanning: boolean
  start: (
    camera: string | MediaTrackConstraints,
    config: { fps: number; qrbox?: number | { width: number; height: number } },
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

async function pickCamera(Html5Qrcode: {
  getCameras: () => Promise<Array<{ id: string; label: string }>>
}) {
  try {
    const cameras = await Html5Qrcode.getCameras()
    if (cameras.length === 0) return { facingMode: 'environment' } as const
    const back = cameras.find((camera) => /back|rear|environment|trasera/i.test(camera.label))
    return back?.id ?? cameras[0]!.id
  } catch {
    return { facingMode: 'environment' } as const
  }
}

async function shutDown(scanner: Html5Scanner | null) {
  if (!scanner) return
  try {
    if (scanner.isScanning) await scanner.stop()
  } catch {
    // Puede fallar si la cámara ya se cerró.
  }
  try {
    scanner.clear()
  } catch {
    // Ignorar limpieza parcial.
  }
}

export function QrScanner({
  onScan,
  onError,
}: {
  onScan: (value: string) => void
  onError: (message: string) => void
}) {
  const elementId = useId().replace(/:/g, '')
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
    const readerId = `qr-reader-${elementId}`

    const run = cameraQueue.then(async () => {
      if (cancelled) return
      const { Html5Qrcode } = await import('html5-qrcode')
      if (cancelled) return

      const instance = new Html5Qrcode(readerId, { verbose: false })
      scanner = instance

      const camera = await pickCamera(Html5Qrcode)
      if (cancelled) {
        await shutDown(instance)
        return
      }

      await instance.start(
        camera,
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const side = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72)
            return { width: side, height: side }
          },
        },
        (decoded) => {
          if (reported || cancelled) return
          reported = true
          const value = decoded.trim()
          void shutDown(instance).finally(() => {
            if (!cancelled) onScanRef.current(value)
          })
        },
        () => {},
      )

      if (cancelled) await shutDown(instance)
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
      cameraQueue = cameraQueue.then(
        () => shutDown(scanner),
        () => shutDown(scanner),
      )
    }
  }, [elementId])

  return <div className="qr-reader" id={`qr-reader-${elementId}`} />
}
