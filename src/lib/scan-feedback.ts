let audioCtx: AudioContext | null = null

function getAudioContext() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  return audioCtx
}

/** iOS solo permite audio después de un gesto del usuario. */
export async function unlockScanFeedback() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') await ctx.resume()

  // Beep silencioso para “despertar” el audio en algunos WebViews.
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.01)
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, volume = 0.08) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
  } catch {
    // Android Chrome lo soporta; iOS casi nunca.
  }
}

export async function playScanFeedback(ok: boolean) {
  await unlockScanFeedback()
  vibrate(ok ? [40, 50, 40] : [160, 80, 160])

  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  if (ok) {
    tone(ctx, 880, now, 0.12, 0.09)
    tone(ctx, 1175, now + 0.12, 0.16, 0.09)
  } else {
    tone(ctx, 220, now, 0.18, 0.1)
    tone(ctx, 165, now + 0.16, 0.28, 0.1)
  }
}
