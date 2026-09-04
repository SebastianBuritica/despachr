import { describe, it, expect } from 'vitest'
import { calcularCumplimiento, estadoCumplido, type EntregaInforme } from './cumplimiento'

const e = (p: Partial<EntregaInforme>): EntregaInforme => ({
  factura: null, conductor: null, fechaReprogramada: null, fotoCumplidoUrl: null,
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

describe('fechaReprogramada nunca entra al cálculo', () => {
  it('sigue midiendo contra la fecha programada aunque haya 2da fecha', () => {
    // Confirmado por la dueña (2026-09-02): "siempre con la primera fecha,
    // porque es la que está en la malla". Si esto se rompe, el % deja de
    // coincidir con el que el cliente calcula por su lado.
    const r = calcularCumplimiento([
      e({ fechaProgramada: '2026-08-20', fechaEntrega: '2026-08-22', fechaReprogramada: '2026-08-22' }),
    ])
    expect(r.aTiempo).toBe(0)
    expect(r.tarde).toBe(1)
  })
})

describe('estadoCumplido — distinto del estado de la entrega', () => {
  it('null cuando la mercancía ni siquiera se entregó', () => {
    // "¿volvió el papel?" no aplica todavía si no hubo entrega.
    expect(estadoCumplido(e({ estado: 'novedad' }))).toBeNull()
    expect(estadoCumplido(e({ estado: 'pendiente' }))).toBeNull()
  })

  it('PENDIENTE cuando se entregó pero el papel firmado no ha vuelto', () => {
    // El caso real del archivo del cliente: ESTATUS=ENTREGADO, CUMPLIDO=PENDIENTE.
    expect(estadoCumplido(e({ estado: 'entregado', fotoCumplidoUrl: null }))).toBe('PENDIENTE')
  })

  it('ENTREGADO cuando el papel ya volvió', () => {
    expect(estadoCumplido(e({ estado: 'entregado', fotoCumplidoUrl: 'cumplidos/x.jpg' }))).toBe('ENTREGADO')
  })
})
