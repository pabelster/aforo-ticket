import type { IssuedTicket } from '../types/database.ts'
import { formatEventDate, formatTime } from './format.ts'

const paper = '#f4f1ea'
const ink = '#1c1b17'
const muted = '#6f6b62'
const exportWidth = 420

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo preparar la imagen del boleto.'))
    image.src = src
  })
}

function field(label: string, value: string) {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'min-width:0;'

  const caption = document.createElement('span')
  caption.textContent = label
  caption.style.cssText =
    'display:block;margin-bottom:2px;color:#6f6b62;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;'

  const text = document.createElement('div')
  text.textContent = value
  text.style.cssText = 'color:#1c1b17;font-size:15px;line-height:1.35;word-break:break-word;'

  wrap.append(caption, text)
  return wrap
}

function buildTicketNode(ticket: IssuedTicket, qrUrl: string) {
  const root = document.createElement('article')
  root.style.cssText = [
    `width:${exportWidth}px`,
    'margin:0',
    'padding:0',
    'overflow:hidden',
    'border-radius:28px',
    `background:${paper}`,
    `color:${ink}`,
    'font-family:Arial,Helvetica,sans-serif',
    'box-sizing:border-box',
  ].join(';')

  const top = document.createElement('div')
  top.style.cssText = 'padding:22px 22px 8px;box-sizing:border-box;'

  const brand = document.createElement('p')
  brand.textContent = 'AFORO'
  brand.style.cssText =
    `margin:0;color:${muted};font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;`

  const title = document.createElement('h2')
  title.textContent = ticket.event_name
  title.style.cssText =
    'margin:8px 0 0;font-size:34px;line-height:1.05;font-weight:700;letter-spacing:-0.03em;word-break:break-word;'

  const meta = document.createElement('div')
  meta.style.cssText =
    'display:grid;grid-template-columns:1fr 1fr;gap:14px 12px;margin-top:18px;'
  meta.append(
    field('Fecha', formatEventDate(ticket.event_date)),
    field('Hora', formatTime(ticket.start_time)),
    field('Lugar', ticket.location),
    field('Asistente', ticket.attendee_name),
  )

  top.append(brand, title, meta)

  const tear = document.createElement('div')
  tear.style.cssText =
    'height:24px;margin:8px 22px 0;border-top:1.5px dashed #d8d2c6;box-sizing:border-box;'

  const bottom = document.createElement('div')
  bottom.style.cssText =
    'display:grid;grid-template-columns:1fr 128px;gap:12px;align-items:end;padding:4px 22px 22px;box-sizing:border-box;'

  const numberWrap = document.createElement('div')
  const numberLabel = document.createElement('p')
  numberLabel.textContent = 'BOLETO'
  numberLabel.style.cssText =
    `margin:0;color:${muted};font-size:11px;font-weight:700;letter-spacing:0.16em;`
  const number = document.createElement('p')
  number.textContent = ticket.ticket_number
  number.style.cssText = 'margin:6px 0 0;font-family:Consolas,monospace;font-size:18px;font-weight:700;'
  numberWrap.append(numberLabel, number)

  const qr = document.createElement('div')
  qr.style.cssText =
    'width:128px;height:128px;padding:6px;border-radius:12px;background:#fff;box-sizing:border-box;'
  const img = document.createElement('img')
  img.src = qrUrl
  img.alt = ''
  img.width = 116
  img.height = 116
  img.style.cssText = 'display:block;width:116px;height:116px;'
  qr.append(img)

  bottom.append(numberWrap, qr)
  root.append(top, tear, bottom)
  return root
}

async function renderTicketPng(ticket: IssuedTicket, qrUrl: string) {
  await loadImage(qrUrl)

  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:420px;pointer-events:none;z-index:-1;'
  const node = buildTicketNode(ticket, qrUrl)
  host.append(node)
  document.body.append(host)

  try {
    // Espera un frame para que el layout y la imagen del QR queden listos.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const { toPng } = await import('html-to-image')
    return await toPng(node, {
      width: exportWidth,
      height: Math.ceil(node.getBoundingClientRect().height),
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: paper,
      skipFonts: true,
      style: {
        margin: '0',
        transform: 'none',
        width: `${exportWidth}px`,
      },
    })
  } finally {
    host.remove()
  }
}

function saveUrl(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

export async function downloadTicketPng(ticket: IssuedTicket, qrUrl: string, filename: string) {
  saveUrl(await renderTicketPng(ticket, qrUrl), filename)
}

export async function downloadTicketsPdf(
  tickets: Array<{ ticket: IssuedTicket; qrUrl: string }>,
  filename: string,
) {
  if (tickets.length === 0) return

  let pdf: import('jspdf').jsPDF | null = null
  for (const item of tickets) {
    const dataUrl = await renderTicketPng(item.ticket, item.qrUrl)
    const image = await loadImage(dataUrl)
    const width = 105
    const height = width * (image.height / image.width)
    if (!pdf) {
      const { jsPDF } = await import('jspdf')
      pdf = new jsPDF({ unit: 'mm', format: [width, height], orientation: 'portrait' })
    } else {
      pdf.addPage([width, height], 'portrait')
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
  }

  pdf?.save(filename)
}
