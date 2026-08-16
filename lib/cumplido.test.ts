import { describe, expect, it, vi } from 'vitest'
import {
  confirmarCumplido,
  nuevoProgreso,
  type CumplidoDeps,
  type CumplidoEntrada,
} from '@/lib/cumplido'

// El File real no importa: las dependencias son dobles. Se castea para no
// depender de que el runtime traiga `File` global.
const FOTO = { name: 'cumplido.jpg' } as unknown as File
const FIRMA = { size: 42 } as unknown as Blob
const COORDS = { latitude: 4.6, longitude: -74.08 }

function entrada(over: Partial<CumplidoEntrada> = {}): CumplidoEntrada {
  return {
    routeId: 'route-1',
    deliveryId: 'delivery-1',
    foto: FOTO,
    recibidoPor: 'Juan Pérez',
    hayFirma: false,
    obtenerFirma: async () => FIRMA,
    ...over,
  }
}

function deps(over: Partial<CumplidoDeps> = {}): CumplidoDeps {
  return {
    subirFoto: vi.fn(async () => 'route-1/delivery-1/cumplido.jpg'),
    subirFirma: vi.fn(async () => 'route-1/delivery-1/firma.png'),
    registrarSalida: vi.fn(async () => {}),
    marcarEntregada: vi.fn(async () => {}),
    capturarUbicacion: vi.fn(async () => COORDS),
    ...over,
  }
}

describe('confirmarCumplido — camino feliz', () => {
  it('sube la foto, registra la salida y marca entregada, en ese orden', async () => {
    const orden: string[] = []
    const d = deps({
      subirFoto: vi.fn(async () => {
        orden.push('foto')
        return 'p/foto.jpg'
      }),
      registrarSalida: vi.fn(async () => {
        orden.push('salida')
      }),
      marcarEntregada: vi.fn(async () => {
        orden.push('entregada')
      }),
    })
    const progreso = nuevoProgreso()

    const { coords } = await confirmarCumplido(entrada(), progreso, d)

    // 'entregada' SIEMPRE de último: es el flip que hace visible la entrega.
    expect(orden).toEqual(['foto', 'salida', 'entregada'])
    expect(coords).toEqual(COORDS)
    expect(progreso).toEqual({
      fotoPath: 'p/foto.jpg',
      firmaPath: null,
      salidaRegistrada: true,
    })
  })

  it('recorta el nombre de quien recibe antes de persistirlo', async () => {
    const d = deps()
    await confirmarCumplido(entrada({ recibidoPor: '  Ana Gómez  ' }), nuevoProgreso(), d)

    expect(d.marcarEntregada).toHaveBeenCalledWith(
      'delivery-1',
      expect.objectContaining({ recibidoPor: 'Ana Gómez' })
    )
  })

  it('sin GPS cierra igual y propaga coords null (el GPS nunca bloquea)', async () => {
    const d = deps({ capturarUbicacion: vi.fn(async () => null) })

    const { coords } = await confirmarCumplido(entrada(), nuevoProgreso(), d)

    expect(coords).toBeNull()
    expect(d.registrarSalida).toHaveBeenCalledWith('delivery-1', 'route-1', null)
    expect(d.marcarEntregada).toHaveBeenCalledTimes(1)
  })
})

describe('confirmarCumplido — la entrega NO se cierra si algo falla antes', () => {
  it('si la foto falla, no marca entregada (la entrega sigue en_punto)', async () => {
    const d = deps({
      subirFoto: vi.fn(async () => {
        throw new Error('storage caído')
      }),
    })
    const progreso = nuevoProgreso()

    await expect(confirmarCumplido(entrada(), progreso, d)).rejects.toThrow('storage caído')

    expect(d.registrarSalida).not.toHaveBeenCalled()
    expect(d.marcarEntregada).not.toHaveBeenCalled()
    expect(progreso.fotoPath).toBeNull()
  })

  it('si la salida falla, no marca entregada pero conserva la foto ya subida', async () => {
    const d = deps({
      registrarSalida: vi.fn(async () => {
        throw new Error('sin red')
      }),
    })
    const progreso = nuevoProgreso()

    await expect(confirmarCumplido(entrada(), progreso, d)).rejects.toThrow('sin red')

    expect(d.marcarEntregada).not.toHaveBeenCalled()
    expect(progreso.fotoPath).toBe('route-1/delivery-1/cumplido.jpg')
    expect(progreso.salidaRegistrada).toBe(false)
  })
})

describe('confirmarCumplido — el reintento reanuda, no reinicia', () => {
  it('no vuelve a subir la foto ni a registrar la salida ya hechas', async () => {
    // Primer intento: todo bien hasta marcarEntregada, que revienta.
    let fallar = true
    const d = deps({
      marcarEntregada: vi.fn(async () => {
        if (fallar) throw new Error('timeout')
      }),
    })
    const progreso = nuevoProgreso()

    await expect(confirmarCumplido(entrada(), progreso, d)).rejects.toThrow('timeout')
    expect(d.subirFoto).toHaveBeenCalledTimes(1)
    expect(d.registrarSalida).toHaveBeenCalledTimes(1)

    // Segundo intento con el MISMO progreso.
    fallar = false
    await confirmarCumplido(entrada(), progreso, d)

    // Re-subir la misma foto choca con upsert:false del helper de Storage, y
    // registrar la salida dos veces duplicaría el evento (y el cálculo de
    // tiempo_en_punto que dispara el trigger).
    expect(d.subirFoto).toHaveBeenCalledTimes(1)
    expect(d.registrarSalida).toHaveBeenCalledTimes(1)
    expect(d.marcarEntregada).toHaveBeenCalledTimes(2)
  })

  it('no re-sube una firma ya subida', async () => {
    let fallar = true
    const d = deps({
      marcarEntregada: vi.fn(async () => {
        if (fallar) throw new Error('timeout')
      }),
    })
    const progreso = nuevoProgreso()
    const e = entrada({ hayFirma: true })

    await expect(confirmarCumplido(e, progreso, d)).rejects.toThrow()
    fallar = false
    await confirmarCumplido(e, progreso, d)

    expect(d.subirFirma).toHaveBeenCalledTimes(1)
    expect(progreso.firmaPath).toBe('route-1/delivery-1/firma.png')
  })
})

describe('confirmarCumplido — la firma es opcional y nunca bloquea', () => {
  it('sin trazo no pide ni sube firma, y persiste firmaUrl null', async () => {
    const obtenerFirma = vi.fn(async () => FIRMA)
    const d = deps()

    await confirmarCumplido(entrada({ hayFirma: false, obtenerFirma }), nuevoProgreso(), d)

    expect(obtenerFirma).not.toHaveBeenCalled()
    expect(d.subirFirma).not.toHaveBeenCalled()
    expect(d.marcarEntregada).toHaveBeenCalledWith(
      'delivery-1',
      expect.objectContaining({ firmaUrl: null })
    )
  })

  it('si toBlob devuelve null avisa pero completa la entrega', async () => {
    // Este es el bug que se arregló: antes se descartaba en silencio y el
    // conductor veía "entregado" con una firma que no existía.
    const onFirmaPerdida = vi.fn()
    const d = deps()

    await confirmarCumplido(
      entrada({ hayFirma: true, obtenerFirma: async () => null }),
      nuevoProgreso(),
      d,
      { onFirmaPerdida }
    )

    expect(onFirmaPerdida).toHaveBeenCalledTimes(1)
    expect(d.subirFirma).not.toHaveBeenCalled()
    // La entrega SÍ se cierra: la evidencia legal es la foto de la factura.
    expect(d.marcarEntregada).toHaveBeenCalledWith(
      'delivery-1',
      expect.objectContaining({ fotoUrl: expect.any(String), firmaUrl: null })
    )
  })
})

describe('confirmarCumplido — etapas visibles', () => {
  it('reporta cada etapa para que el conductor sepa qué está pasando', async () => {
    const etapas: string[] = []
    await confirmarCumplido(entrada({ hayFirma: true }), nuevoProgreso(), deps(), {
      onEtapa: (e) => etapas.push(e),
    })

    expect(etapas).toEqual([
      'Subiendo foto…',
      'Subiendo firma…',
      'Registrando salida…',
      'Guardando…',
    ])
  })
})
