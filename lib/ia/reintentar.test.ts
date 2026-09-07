import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { conReintentoGemini } from './reintentar'

const erroGoogle = (code: number, retryDelay?: string) =>
  new Error(
    JSON.stringify({
      error: {
        code,
        message: 'x',
        details: retryDelay
          ? [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay }]
          : [],
      },
    })
  )

// Timers falsos en todo el archivo: sin esto, cada backoff real duerme
// segundos de verdad y el suite completo (hoy ~150ms) se vuelve lento en
// silencio a medida que se agregan más pruebas de reintento.
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('conReintentoGemini', () => {
  it('reintenta ante 429 y devuelve el resultado si el segundo intento funciona', async () => {
    const llamar = vi.fn().mockRejectedValueOnce(erroGoogle(429)).mockResolvedValueOnce('ok')
    const promesa = conReintentoGemini(llamar)
    await vi.runAllTimersAsync()
    await expect(promesa).resolves.toBe('ok')
    expect(llamar).toHaveBeenCalledTimes(2)
  })

  it('reintenta ante 503', async () => {
    const llamar = vi.fn().mockRejectedValueOnce(erroGoogle(503)).mockResolvedValueOnce('ok')
    const promesa = conReintentoGemini(llamar)
    await vi.runAllTimersAsync()
    await expect(promesa).resolves.toBe('ok')
  })

  it('NO reintenta ante un error no transitorio (400) — mismo resultado en el próximo intento', async () => {
    const llamar = vi.fn().mockRejectedValue(erroGoogle(400))
    await expect(conReintentoGemini(llamar)).rejects.toThrow()
    // Un solo intento: reintentar un esquema mal formado no lo arregla, sólo quema tiempo/cuota.
    expect(llamar).toHaveBeenCalledTimes(1)
  })

  it('se rinde tras 3 intentos si el error persiste', async () => {
    const llamar = vi.fn().mockRejectedValue(erroGoogle(429))
    const promesa = conReintentoGemini(llamar)
    // Evita que un rechazo no atrapado por Node antes del await se reporte como unhandled.
    promesa.catch(() => {})
    await vi.runAllTimersAsync()
    await expect(promesa).rejects.toThrow()
    expect(llamar).toHaveBeenCalledTimes(3)
  })

  it('respeta el retryDelay que manda Google en vez de un backoff fijo', async () => {
    const llamar = vi.fn().mockRejectedValueOnce(erroGoogle(429, '5s')).mockResolvedValueOnce('ok')
    const promesa = conReintentoGemini(llamar)
    await vi.advanceTimersByTimeAsync(4999)
    expect(llamar).toHaveBeenCalledTimes(1) // todavía no pasaron los 5s indicados
    await vi.advanceTimersByTimeAsync(1)
    await expect(promesa).resolves.toBe('ok')
  })
})
