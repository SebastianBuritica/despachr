import { beforeEach, describe, expect, it, vi } from 'vitest'

// Doble de `lib/offline/db`: la cola se prueba por su comportamiento (orden,
// corte, reanudación), no contra IndexedDB real, que no existe en node.
const almacen = new Map<string, { id: string; creadoEn: number }>()

vi.mock('@/lib/offline/db', () => ({
  guardar: async (r: { id: string; creadoEn: number }) => {
    almacen.set(r.id, r)
  },
  listar: async () => [...almacen.values()].sort((a, b) => a.creadoEn - b.creadoEn),
  borrar: async (id: string) => {
    almacen.delete(id)
  },
  contar: async () => almacen.size,
  hayIndexedDB: () => true,
}))

const {
  encolar,
  procesarCola,
  contarPendientes,
  pendientes,
  _resetCandado,
} = await import('@/lib/offline/cola')
type Pendiente = Awaited<ReturnType<typeof pendientes>>[number]

function evento(id: string, creadoEn: number, deliveryId = 'd1'): Pendiente {
  return {
    id,
    tipo: 'evento',
    creadoEn,
    tipoEvento: 'llegada_punto',
    deliveryId,
    routeId: 'r1',
    coords: null,
    timestamp: new Date(creadoEn).toISOString(),
  }
}

function cumplido(id: string, creadoEn: number): Pendiente {
  return {
    id,
    tipo: 'cumplido',
    creadoEn,
    deliveryId: 'd1',
    routeId: 'r1',
    foto: { size: 1 } as unknown as Blob,
    firma: null,
    recibidoPor: 'Ana',
    coords: { latitude: 4.6, longitude: -74.08 },
    salida: { id: 'salida-1', timestamp: new Date(creadoEn).toISOString() },
    progreso: { fotoPath: null, firmaPath: null, salidaRegistrada: false },
  }
}

// Enviadores por defecto (no-op). Cada caso sobrescribe sólo el que le importa.
function deps(over: Partial<Parameters<typeof procesarCola>[0]> = {}) {
  return {
    enviarEvento: async () => {},
    enviarCumplido: async () => {},
    enviarNovedad: async () => {},
    ...over,
  }
}

beforeEach(() => {
  almacen.clear()
  _resetCandado()
})

describe('cola offline — orden', () => {
  it('envía en orden de creación, no de inserción', async () => {
    // Se guardan desordenados a propósito.
    await encolar(evento('b', 2000))
    await encolar(evento('a', 1000))
    await encolar(evento('c', 3000))

    const vistos: string[] = []
    const r = await procesarCola(
      deps({
        enviarEvento: async (p) => {
          vistos.push(p.id)
        },
      })
    )

    // El orden importa: los triggers derivan hora_llegada / tiempo_en_punto de
    // la secuencia. Una salida antes que su llegada da un tiempo absurdo.
    expect(vistos).toEqual(['a', 'b', 'c'])
    expect(r).toEqual({ enviados: 3, restantes: 0 })
    expect(await contarPendientes()).toBe(0)
  })

  it('se detiene en el primer fallo y NO adelanta los siguientes', async () => {
    await encolar(evento('a', 1000))
    await encolar(evento('b', 2000))
    await encolar(evento('c', 3000))

    const vistos: string[] = []
    const r = await procesarCola(
      deps({
        enviarEvento: async (p) => {
          vistos.push(p.id)
          if (p.id === 'b') throw new Error('sin red')
        },
      })
    )

    expect(vistos).toEqual(['a', 'b'])
    expect(r.enviados).toBe(1)
    expect(r.error).toBeInstanceOf(Error)
    // 'a' se borró; 'b' y 'c' siguen en cola, en orden.
    expect((await pendientes()).map((p) => p.id)).toEqual(['b', 'c'])
  })

  it('lo enviado se borra; lo fallido se conserva para reintentar', async () => {
    await encolar(evento('a', 1000))
    await encolar(evento('b', 2000))

    await procesarCola(
      deps({
        enviarEvento: async (p) => {
          if (p.id === 'b') throw new Error('sin red')
        },
      })
    )
    expect(await contarPendientes()).toBe(1)

    // Vuelve la señal.
    const r2 = await procesarCola(deps())
    expect(r2).toEqual({ enviados: 1, restantes: 0 })
    expect(await contarPendientes()).toBe(0)
  })
})

describe('cola offline — cumplidos', () => {
  it('enruta cada pendiente a su enviador', async () => {
    await encolar(evento('e1', 1000))
    await encolar(cumplido('c1', 2000))

    const enviarEvento = vi.fn<(p: Pendiente) => Promise<void>>(async () => {})
    const enviarCumplido = vi.fn<(p: Pendiente) => Promise<void>>(async () => {})
    await procesarCola(deps({ enviarEvento, enviarCumplido }))

    expect(enviarEvento).toHaveBeenCalledTimes(1)
    expect(enviarCumplido).toHaveBeenCalledTimes(1)
    expect(enviarCumplido.mock.calls[0][0]).toMatchObject({ id: 'c1', recibidoPor: 'Ana' })
  })

  it('conserva la foto y las coords del momento de la entrega', async () => {
    await encolar(cumplido('c1', 2000))

    let recibido: Pendiente | undefined
    await procesarCola(
      deps({
        enviarCumplido: async (p) => {
          recibido = p
        },
      })
    )

    // Las coords son las de ENTONCES: al sincronizar el conductor puede estar
    // a 50 km, y una lectura nueva ubicaría la entrega donde no fue.
    expect(recibido).toMatchObject({
      coords: { latitude: 4.6, longitude: -74.08 },
      salida: { id: 'salida-1' },
    })
    expect((recibido as { foto: Blob }).foto).toBeDefined()
  })
})

describe('cola offline — concurrencia', () => {
  it('dos pasadas simultáneas no envían lo mismo dos veces', async () => {
    await encolar(evento('a', 1000))
    await encolar(evento('b', 2000))

    let enCurso = 0
    let solapado = false
    const enviarEvento = async () => {
      enCurso++
      if (enCurso > 1) solapado = true
      await new Promise((r) => setTimeout(r, 5))
      enCurso--
    }

    // El evento `online` y el reintento periódico pueden coincidir.
    const [r1, r2] = await Promise.all([
      procesarCola(deps({ enviarEvento })),
      procesarCola(deps({ enviarEvento })),
    ])

    expect(solapado).toBe(false)
    expect(r1.enviados + r2.enviados).toBe(2)
    expect(await contarPendientes()).toBe(0)
  })
})
