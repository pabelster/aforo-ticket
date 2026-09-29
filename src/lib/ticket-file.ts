const paper = '#f4f1ea'

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo preparar la imagen del boleto.'))
    image.src = src
  })
}

async function renderPass(node: HTMLElement) {
  const { toPng } = await import('html-to-image')
  return toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: paper })
}

function saveUrl(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

export async function downloadTicketPng(node: HTMLElement, filename: string) {
  saveUrl(await renderPass(node), filename)
}

export async function downloadTicketsPdf(nodes: HTMLElement[], filename: string) {
  if (nodes.length === 0) return

  let pdf: import('jspdf').jsPDF | null = null
  for (const node of nodes) {
    const dataUrl = await renderPass(node)
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
