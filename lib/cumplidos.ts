// Procesar el lote escaneado de cumplidos.
//
// QUÉ LLEGA: un PDF de CamScanner con ~23 páginas, una factura por página,
// SIN capa de texto (imagen pura). Así es exactamente como el trabajo le llega
// hoy a quien administra los cumplidos.
//
// POR QUÉ SIN LIBRERÍA: CamScanner incrusta los JPEG literales en el PDF, así
// que partir el lote es escanear marcadores de bytes. Meter `pdf.js` o `sharp`
// por esto serían megabytes de dependencia para ~20 líneas.
//
// POR QUÉ EN EL NAVEGADOR: 23 páginas × una llamada al modelo cada una no cabe
// en el timeout de una función serverless. Partiendo aquí, el navegador manda
// una página por request y además puede mostrar progreso real.

/** Un JPEG va de FFD8FF a FFD9. Devuelve cada página del lote, en orden. */
export function extraerPaginasJpeg(
  pdf: Uint8Array,
  minBytes = 40_000
): Uint8Array<ArrayBuffer>[] {
  const paginas: Uint8Array<ArrayBuffer>[] = []
  let i = 0
  while (i < pdf.length - 3) {
    if (pdf[i] === 0xff && pdf[i + 1] === 0xd8 && pdf[i + 2] === 0xff) {
      let j = i + 3
      while (j < pdf.length - 1 && !(pdf[j] === 0xff && pdf[j + 1] === 0xd9)) j++
      if (j >= pdf.length - 1) break
      const blob = pdf.subarray(i, j + 2)
      // El umbral descarta las miniaturas que CamScanner incrusta junto a cada
      // página; sin él saldrían el doble de "páginas", la mitad ilegibles.
      // COPIA, no `subarray`: una vista mantiene vivo el PDF entero (14 MB) en
      // memoria mientras exista cualquier página, y además un Uint8Array sobre
      // un buffer compartido no sirve como BlobPart.
      if (blob.length >= minBytes) paginas.push(new Uint8Array(blob))
      i = j + 2
    } else {
      i++
    }
  }
  return paginas
}

/**
 * Número de factura comparable.
 *
 * La misma factura aparece como `FEV76883` en el encabezado y como `76883` en
 * "Notas Factura", y el Excel del cliente puede traer cualquiera de las dos.
 * Comparar en crudo haría fallar emparejamientos correctos, así que se compara
 * por los dígitos. Se conserva el original para mostrarlo.
 */
export function normalizarFactura(valor: string | null | undefined): string | null {
  if (!valor) return null
  const digitos = valor.replace(/\D/g, '').replace(/^0+/, '')
  return digitos.length ? digitos : null
}

export function mismaFactura(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizarFactura(a)
  const nb = normalizarFactura(b)
  return na !== null && na === nb
}

/**
 * `deliveries.hora_salida_punto` desde la fecha (+hora opcional) manuscrita
 * que leyó el agente de cumplido. `lib/cumplimiento.ts` deriva "a tiempo" de
 * esa columna — una conversión de zona equivocada aquí corre el cumplimiento
 * un día sin que se note hasta que alguien compare contra el papel.
 */
export function horaSalidaDesdeExtraccion(extraido: {
  fecha_entrega: string | null
  hora_entrega: string | null
}): string | null {
  if (!extraido.fecha_entrega) return null
  // Colombia no tiene horario de verano: -05:00 es un offset fijo. Sin hora
  // manuscrita, mediodía es un punto neutro que no cruza medianoche al
  // convertir de vuelta a la fecha calendario de Bogotá.
  return `${extraido.fecha_entrega}T${extraido.hora_entrega ?? '12:00'}:00-05:00`
}
