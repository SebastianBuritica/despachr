import { describe, expect, it, vi } from 'vitest'
import {
  nuevoProgresoNovedad,
  reportarNovedad,
  type NovedadDeps,
  type NovedadEntrada,
} from '@/lib/novedad'

const FOTO = { name: 'novedad.jpg' } as unknown as File
const COORDS = { latitude: 8.75, longitude: -75.88 } // Montería

function entrada(over: Partial<NovedadEntrada> = {}): NovedadEntrada {
  return {
    novedadId: 'nov-1',
    routeId: 'route-1',
    deliveryId: 'delivery-1',
    tipo: 'danado',
    descripcion: 'Dos cajas llegaron mojadas',
    foto: null,
    ...over,
  }
}

function deps(over: Partial<NovedadDeps> = {}): NovedadDeps {
  return {
    subirFoto: vi.fn(async () => 'route-1/delivery-1/novedad.jpg'),
    crearNovedad: vi.fn(async () => {}),
    registrarEventoNovedad: vi.fn(async () => {}),
    marcarConNovedad: vi.fn(async () => {}),
    capturarUbicacion: vi.fn(async () => COORDS),
    ...over,
  }
}

describe('reportarNovedad — cierra la entrega, en el orden correcto', () => {
  it('reporta, deja el evento y CIERRA de último', async () => {
    const orden: string[] = []
    const d = deps({
      crearNovedad: vi.fn(async () => {
        orden.push('novedad')
      }),
      registrarEventoNovedad: vi.fn(async () => {
        orden.push('evento')
      }),
      marcarConNovedad: vi.fn(async () => {
        orden.push('cerrada')
      }),
    })

    await reportarNovedad(entrada(), nuevoProgresoNovedad(), d)

    // Cerrar de último: una entrega en 'novedad' sin novedad que la explique
    // deja al coordinador sin nada que resolver.
    expect(orden).toEqual(['novedad', 'evento', 'cerrada'])
  })

  it('sin foto no sube nada y persiste fotoUrl null', async () => {
    const d = deps()
    await reportarNovedad(entrada({ foto: null }), nuevoProgresoNovedad(), d)

    expect(d.subirFoto).not.toHaveBeenCalled()
    expect(d.crearNovedad).toHaveBeenCalledWith(
      expect.objectContaining({ fotoUrl: null, tipo: 'danado' })
    )
  })

  it('con foto la sube antes de reportar y la enlaza', async () => {
    const d = deps()
    await reportarNovedad(entrada({ foto: FOTO }), nuevoProgresoNovedad(), d)

    expect(d.subirFoto).toHaveBeenCalledWith('route-1', 'delivery-1', FOTO)
    expect(d.crearNovedad).toHaveBeenCalledWith(
      expect.objectContaining({ fotoUrl: 'route-1/delivery-1/novedad.jpg' })
    )
  })

  it('recorta la descripción', async () => {
    const d = deps()
    await reportarNovedad(
      entrada({ descripcion: '  Cliente cerrado  ' }),
      nuevoProgresoNovedad(),
      d
    )
    expect(d.crearNovedad).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion: 'Cliente cerrado' })
    )
  })
})

describe('reportarNovedad — no cierra si algo falló antes', () => {
  it('si la foto falla, la entrega NO se cierra', async () => {
    const d = deps({
      subirFoto: vi.fn(async () => {
        throw new Error('storage caído')
      }),
    })
    const progreso = nuevoProgresoNovedad()

    await expect(
      reportarNovedad(entrada({ foto: FOTO }), progreso, d)
    ).rejects.toThrow('storage caído')

    expect(d.crearNovedad).not.toHaveBeenCalled()
    expect(d.marcarConNovedad).not.toHaveBeenCalled()
    expect(progreso.novedadRegistrada).toBe(false)
  })

  it('si el reporte falla, la entrega NO se cierra', async () => {
    const d = deps({
      crearNovedad: vi.fn(async () => {
        throw new Error('sin red')
      }),
    })
    await expect(reportarNovedad(entrada(), nuevoProgresoNovedad(), d)).rejects.toThrow('sin red')
    expect(d.marcarConNovedad).not.toHaveBeenCalled()
  })
})

describe('reportarNovedad — el reintento reanuda', () => {
  it('no re-sube la foto ni re-reporta lo ya hecho', async () => {
    let fallar = true
    const d = deps({
      marcarConNovedad: vi.fn(async () => {
        if (fallar) throw new Error('timeout')
      }),
    })
    const progreso = nuevoProgresoNovedad()
    const e = entrada({ foto: FOTO })

    await expect(reportarNovedad(e, progreso, d)).rejects.toThrow('timeout')
    expect(progreso).toMatchObject({ novedadRegistrada: true, eventoRegistrado: true })

    fallar = false
    await reportarNovedad(e, progreso, d)

    expect(d.subirFoto).toHaveBeenCalledTimes(1)
    expect(d.crearNovedad).toHaveBeenCalledTimes(1)
    expect(d.registrarEventoNovedad).toHaveBeenCalledTimes(1)
    expect(d.marcarConNovedad).toHaveBeenCalledTimes(2)
  })
})

describe('reportarNovedad — GPS', () => {
  it('sin ubicación reporta igual (el GPS nunca bloquea)', async () => {
    const d = deps({ capturarUbicacion: vi.fn(async () => null) })
    const { coords } = await reportarNovedad(entrada(), nuevoProgresoNovedad(), d)

    expect(coords).toBeNull()
    expect(d.registrarEventoNovedad).toHaveBeenCalledWith('delivery-1', 'route-1', null)
    expect(d.marcarConNovedad).toHaveBeenCalledTimes(1)
  })
})
