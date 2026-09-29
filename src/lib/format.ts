const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatEventDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return dateFormatter.format(new Date(year, month - 1, day))
}

export function formatTime(value: string) {
  return value.slice(0, 5)
}

export function formatPrice(value: number) {
  return moneyFormatter.format(value)
}

export function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`
}

export function coverHue(name: string) {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360
  return `linear-gradient(145deg, hsl(${hue} 42% 32%), hsl(${(hue + 36) % 360} 38% 14%))`
}
