// Cola de operaciones del conductor pendientes de enviar.
//
// El conductor trabaja donde no hay señal (rutas rurales de Córdoba, Atlántico,
// Santander). Marcar "Llegué", tomar la foto y confirmar NO pueden depender de
// la red: se registran localmente y se envían cuando vuelve. Lo que nunca puede
// pasar es perder una captura — es la prueba de entrega de una factura real.

import type { Coords } from '@/lib/geo'
import type { TipoEvento } from '@/types'
import type { CumplidoProgreso } from '@/lib/cumplido'
import type { NovedadProgreso } from '@/lib/novedad'
import type { TipoNovedad } from '@/types'
import type { EventoIdentidad } from '@/lib/queries/events'
import * as db from '@/lib/offline/db'

export interface PendienteEvento {
  /** Es el id del propio evento: la cola y la BD comparten identidad. */
  id: string
  tipo: 'evento'
  creadoEn: number
  tipoEvento: TipoEvento
  deliveryId: string
  routeId: string
  coords: Coords | null
  /** Hora REAL del hecho, no del envío. */
  timestamp: string
}

export interface PendienteCumplido {
  id: string
  tipo: 'cumplido'
  creadoEn: number
  deliveryId: string
  routeId: string
  /** La foto viaja como Blob: es la evidencia y no se puede perder. */
  foto: Blob
  firma: Blob | null
  recibidoPor: string
  coords: Coords | null
  /** Identidad del evento salida_punto que este cumplido dispara. */
  salida: EventoIdentidad
  /** Se re-guarda tras cada paso: un cumplido a medias reanuda, no reinicia. */
  progreso: CumplidoProgreso
}

export interface PendienteNovedad {
  /** Es el id de la propia novedad: la cola y la BD comparten identidad. */
  id: string
  tipo: 'novedad'
  creadoEn: number
  deliveryId: string
  routeId: string
  tipoNovedad: TipoNovedad
  descripcion: string
  /** Opcional: no toda novedad tiene algo que fotografiar. */
  foto: Blob | null
  coords: Coords | null
  /** Identidad del evento `novedad` que este reporte deja en la bitácora. */
  evento: EventoIdentidad
  progreso: NovedadProgreso
}

export type Pendiente = PendienteEvento | PendienteCumplido | PendienteNovedad

export interface ColaDeps {
  enviarEvento: (p: PendienteEvento) => Promise<void>
  enviarCumplido: (p: PendienteCumplido) => Promise<void>
  enviarNovedad: (p: PendienteNovedad) => Promise<void>
}

export async function encolar(p: Pendiente): Promise<void> {
  await db.guardar(p)
}

export async function pendientes(): Promise<Pendiente[]> {
  return db.listar<Pendiente>()
}

export async function contarPendientes(): Promise<number> {
  return db.contar()
}

/** Persiste el avance parcial (cumplido o novedad) para que el reintento reanude. */
export async function actualizarProgreso<
  T extends PendienteCumplido | PendienteNovedad,
>(p: T, progreso: T['progreso']): Promise<void> {
  await db.guardar({ ...p, progreso })
}

export interface ResultadoSync {
  enviados: number
  restantes: number
  /** El error que detuvo la cola, si la detuvo. */
  error?: unknown
}

// Un solo procesamiento a la vez: el evento `online` y el reintento periódico
// pueden dispararse casi juntos, y dos pasadas concurrentes sobre la misma cola
// mandarían la misma operación dos veces.
let procesando = false

/**
 * Envía lo pendiente en ORDEN DE CREACIÓN y se detiene en el primer fallo.
 *
 * El orden importa y el corte también: los triggers de la BD derivan el estado
 * de la entrega del orden de los eventos (llegada antes que salida, o
 * tiempo_en_punto sale absurdo). Saltarse el que falló para seguir con el
 * siguiente rompería esa secuencia, así que se corta y se reintenta después
 * desde el mismo punto.
 *
 * Reenviar es seguro: los eventos van con id de cliente (choque de PK = ya
 * estaba) y `marcarEntregada` es un UPDATE idempotente.
 */
export async function procesarCola(deps: ColaDeps): Promise<ResultadoSync> {
  if (procesando) return { enviados: 0, restantes: await contarPendientes() }
  procesando = true

  let enviados = 0
  try {
    const cola = await pendientes()
    for (const p of cola) {
      try {
        if (p.tipo === 'evento') await deps.enviarEvento(p)
        else if (p.tipo === 'cumplido') await deps.enviarCumplido(p)
        else await deps.enviarNovedad(p)
        await db.borrar(p.id)
        enviados++
      } catch (error) {
        return { enviados, restantes: (await contarPendientes()), error }
      }
    }
    return { enviados, restantes: 0 }
  } finally {
    procesando = false
  }
}

// Sólo para pruebas: reinicia el candado entre casos.
export function _resetCandado(): void {
  procesando = false
}
