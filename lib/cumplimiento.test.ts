import { describe, it, expect } from 'vitest'
import { calcularCumplimiento, type EntregaInforme } from './cumplimiento'

const e = (p: Partial<EntregaInforme>): EntregaInforme => ({
  factura: null, conductor: null,
  tienda: 'X', ciudad: 'Barranquilla', estado: 'entregado',
  fechaProgramada: '2026-08-24', fechaEntrega: '2026-08-24',
  novedad: null, observaciones: null, ...p,
})

describe('calcularCumplimiento', () => {
  it('no mete las entregas sin compromiso en la base del porcentaje', () => {
    // Si `sinCompromiso` entrara al denominador, el cumplimiento diría 50%
    // en vez de 100% y el informe acusaría a la operación de algo que no pasó.
    const r = calcularCumplimiento([e({}), e({ fechaProgramada: null, fechaEntrega: null })])
    expect(r.conCompromiso).toBe(1)
    expect(r.sinCompromiso).toBe(1)
    expect(r.pctCumplimiento).toBe(100)
  })

  it('cuenta tarde la entregada después de la fecha comprometida', () => {
    const r = calcularCumplimiento([e({ fechaEntrega: '2026-08-25' })])
    expect(r.aTiempo).toBe(0)
    expect(r.tarde).toBe(1)
    expect(r.pctCumplimiento).toBe(0)
    expect(r.pctEfectividad).toBe(100) // se entregó, solo que tarde
  })

  it('cierra la entrega con novedad y la agrupa por tipo y ciudad', () => {
    const r = calcularCumplimiento([
      e({}),
      e({ estado: 'novedad', novedad: 'rechazo', fechaEntrega: null, ciudad: 'Cartagena' }),
      e({ estado: 'novedad', novedad: 'rechazo', fechaEntrega: null, ciudad: 'Cartagena' }),
      e({ estado: 'novedad', novedad: 'faltante', fechaEntrega: null, ciudad: 'Montería' }),
    ])
    expect(r.novedades).toBe(3)
    expect(r.porNovedad[0]).toEqual({ tipo: 'rechazo', n: 2 })
    expect(r.porCiudad[0].ciudad).toBe('Cartagena')
  })

  it('devuelve null en vez de 0% cuando no hay contra qué medir', () => {
    // 0% y "no medible" son cosas distintas; pintar 0% sería inventar un dato.
    expect(calcularCumplimiento([]).pctCumplimiento).toBeNull()
  })
})
