import { describe, it, expect } from 'vitest'
import { filasCasablanca, tituloCasablanca } from './casablanca'
import type { EntregaInforme } from '@/lib/cumplimiento'

const e = (p: Partial<EntregaInforme>): EntregaInforme => ({
  factura: 'FEV76883', ordenCompra: null, conductor: null, fechaReprogramada: null, fotoCumplidoUrl: null,
  tienda: 'Makro Montería', ciudad: 'Montería', estado: 'entregado',
  fechaProgramada: '2026-08-20', fechaEntrega: '2026-08-20',
  novedad: null, observaciones: null, ...p,
})

describe('filasCasablanca', () => {
  it('reproduce ESTATUS y CUMPLIDO como dos preguntas distintas', () => {
    // El caso real del archivo: mercancía entregada, papel firmado sin volver.
    const [fila] = filasCasablanca([e({ fotoCumplidoUrl: null })])
    expect(fila.estatus).toBe('ENTREGADO')
    expect(fila.cumplido).toBe('PENDIENTE')
  })

  it('CUMPLIDO queda vacío cuando ni siquiera hubo entrega', () => {
    const [fila] = filasCasablanca([e({ estado: 'novedad', fechaEntrega: null })])
    expect(fila.estatus).toBe('NO ENTREGADO')
    expect(fila.cumplido).toBe('')
  })

  it('lleva el punto de envío y la orden de compra, vacía si no hay dato', () => {
    const [fila] = filasCasablanca([e({ ordenCompra: '67537' })])
    expect(fila.puntoEnvio).toBe('Makro Montería')
    expect(fila.ordenCompra).toBe('67537')
    expect(filasCasablanca([e({ ordenCompra: null })])[0].ordenCompra).toBe('')
  })

  it('formatea fechas y día de semana como el archivo real', () => {
    const [fila] = filasCasablanca([e({})])
    expect(fila.diaEntrega).toBe('JUEVES')
    expect(fila.fechaProgramEntrega).toBe('20/8/2026')
  })

  it('la 2da fecha es sólo referencia — nunca sustituye a la comprometida', () => {
    const [fila] = filasCasablanca([e({ fechaReprogramada: '2026-08-22' })])
    expect(fila.fechaProgramEntrega).toBe('20/8/2026')
    expect(fila.segundaFecha).toBe('22/8/2026')
  })
})

describe('tituloCasablanca', () => {
  it('usa el título de un solo día cuando todas comparten fecha', () => {
    expect(tituloCasablanca([e({}), e({ tienda: 'Éxito' })]))
      .toBe('RELACION DE ENTREGAS JUEVES 20 DE AGOSTO 2026 CASABLANCA')
  })

  it('usa título por rango cuando hay varias fechas comprometidas', () => {
    expect(tituloCasablanca([e({ fechaProgramada: '2026-08-24' }), e({ fechaProgramada: '2026-08-28' })]))
      .toBe('RELACION DE ENTREGAS DEL 24/8/2026 AL 28/8/2026 CASABLANCA')
  })
})
