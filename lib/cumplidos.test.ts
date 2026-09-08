import { describe, it, expect } from 'vitest'
import {
  extraerPaginasJpeg,
  normalizarFactura,
  mismaFactura,
  horaSalidaDesdeExtraccion,
} from './cumplidos'

/** PDF de mentira: bytes cualesquiera con JPEGs incrustados. */
function pdfCon(...jpegs: number[][]): Uint8Array {
  const out: number[] = [0x25, 0x50, 0x44, 0x46] // "%PDF"
  for (const j of jpegs) out.push(0xff, 0xd8, 0xff, ...j, 0xff, 0xd9, 0x0a)
  return new Uint8Array(out)
}

describe('extraerPaginasJpeg', () => {
  it('saca una página por JPEG, en orden', () => {
    const a = new Array(200).fill(0x41)
    const b = new Array(300).fill(0x42)
    const p = extraerPaginasJpeg(pdfCon(a, b), 10)
    expect(p).toHaveLength(2)
    expect(p[0][3]).toBe(0x41)
    expect(p[1][3]).toBe(0x42)
  })

  it('descarta las miniaturas bajo el umbral', () => {
    // CamScanner incrusta una miniatura junto a cada página. Sin el umbral
    // saldría el doble de páginas y la mitad serían ilegibles para el modelo.
    const mini = new Array(50).fill(0x41)
    const real = new Array(5000).fill(0x42)
    expect(extraerPaginasJpeg(pdfCon(mini, real), 1000)).toHaveLength(1)
  })

  it('no se cuelga con un JPEG sin cierre', () => {
    const roto = new Uint8Array([0x25, 0xff, 0xd8, 0xff, 0x41, 0x41, 0x41])
    expect(extraerPaginasJpeg(roto, 1)).toHaveLength(0)
  })
})

describe('normalizarFactura', () => {
  it('empareja el encabezado con las notas de la misma factura', () => {
    // `FEV76883` arriba y `76883` en "Notas Factura" son la misma.
    expect(mismaFactura('FEV76883', '76883')).toBe(true)
    expect(mismaFactura('FEV-76883', ' 76883 ')).toBe(true)
  })

  it('no empareja facturas distintas', () => {
    expect(mismaFactura('FEV76883', 'FEV76885')).toBe(false)
  })

  it('nunca empareja contra vacío — un null no es un match', () => {
    expect(mismaFactura(null, null)).toBe(false)
    expect(mismaFactura('FEV', 'ABC')).toBe(false) // sin dígitos → null
    expect(normalizarFactura('FEV00076883')).toBe('76883')
  })
})

describe('horaSalidaDesdeExtraccion', () => {
  it('sin fecha manuscrita, null — no inventa un cierre', () => {
    expect(horaSalidaDesdeExtraccion({ fecha_entrega: null, hora_entrega: '14:30' })).toBeNull()
  })

  it('con hora manuscrita, la usa tal cual en -05:00', () => {
    const iso = horaSalidaDesdeExtraccion({ fecha_entrega: '2026-08-11', hora_entrega: '14:30' })
    expect(iso).toBe('2026-08-11T14:30:00-05:00')
    // Y la fecha calendario de Bogotá que se recupera es la misma que se metió.
    expect(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(iso!))).toBe(
      '2026-08-11'
    )
  })

  it('sin hora manuscrita, mediodía no cruza medianoche al volver a Bogotá', () => {
    const iso = horaSalidaDesdeExtraccion({ fecha_entrega: '2026-08-11', hora_entrega: null })
    expect(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(iso!))
    ).toBe('2026-08-11')
  })
})
