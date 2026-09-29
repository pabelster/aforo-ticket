import type { Attendee } from '../types/database.ts'

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`
  return safe
}

export function attendeesToCsv(rows: Attendee[], formatWhen: (iso: string) => string) {
  const header = ['evento', 'boleto', 'nombre', 'correo', 'telefono', 'estado', 'compra', 'ingreso']
  const lines = rows.map((row) =>
    [
      row.eventName,
      row.ticketNumber,
      row.attendeeName,
      row.email,
      row.phone ?? '',
      row.status === 'used' ? 'usado' : 'sin usar',
      formatWhen(row.purchaseDate),
      row.usedAt ? formatWhen(row.usedAt) : '',
    ]
      .map(csvCell)
      .join(','),
  )
  return [header.join(','), ...lines].join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
