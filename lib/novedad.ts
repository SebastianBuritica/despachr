// Orquestación del reporte de novedad. Hermana de `lib/cumplido.ts` y por las
// mismas razones: fuera del componente para poder probar el orden y la
// reanudación, y porque la cola offline necesita un punto único que interceptar.
//
// UNA NOVEDAD CIERRA LA ENTREGA (decisión de negocio). El conductor reporta y
// sigue su ruta; no se queda en el punto reintentando. `deliveries.estado`
// queda en 'novedad', que es terminal igual que 'entregado' — el trigger
// check_route_completion ya lo cuenta como cerrado, así que una ruta puede
// completarse con novedades dentro. Resolverla es del coordinador.

import type { Coords } from '@/lib/geo'
import type { TipoNovedad } from '@/types'

export interface NovedadProgreso {
  fotoPath: string | null
  novedadRegistrada: boolean
  eventoRegistrado: boolean
}

export function nuevoProgresoNovedad(): NovedadProgreso {
  return { fotoPath: null, novedadRegistrada: false, eventoRegistrado: false }
}

export interface NovedadEntrada {
  /** Id de cliente de la novedad: reenviar no la duplica. */
  novedadId: string
  routeId: string
  deliveryId: string
  tipo: TipoNovedad
  descripcion: string
  /** Opcional: no toda novedad tiene algo que fotografiar. */
  foto: File | null
}

export interface NovedadDeps {
  subirFoto: (routeId: string, deliveryId: string, file: File) => Promise<string>
  crearNovedad: (n: {
    id: string
    deliveryId: string
    tipo: TipoNovedad
    descripcion: string
    fotoUrl: string | null
  }) => Promise<void>
  registrarEventoNovedad: (
    deliveryId: string,
    routeId: string,
    coords: Coords | null
  ) => Promise<void>
  marcarConNovedad: (deliveryId: string) => Promise<void>
  capturarUbicacion: () => Promise<Coords | null>
}

export interface NovedadCallbacks {
  onEtapa?: (etapa: string) => void
}

/**
 * Reporta la novedad y CIERRA la entrega. Lanza si algo falla, dejando
 * `progreso` con lo ya logrado para que el reintento reanude.
 *
 * El cambio de estado va de ÚLTIMO, igual que en el cumplido: si la foto o la
 * novedad no llegaron, la entrega sigue abierta y se puede reintentar. Cerrarla
 * antes dejaría una entrega marcada con novedad sin novedad que la explique —
 * y el coordinador no tendría qué resolver.
 */
export async function reportarNovedad(
  entrada: NovedadEntrada,
  progreso: NovedadProgreso,
  deps: NovedadDeps,
  cb: NovedadCallbacks = {}
): Promise<{ coords: Coords | null }> {
  const coords = await deps.capturarUbicacion()

  // 1. Foto (opcional).
  if (!progreso.fotoPath && entrada.foto) {
    cb.onEtapa?.('Subiendo foto…')
    progreso.fotoPath = await deps.subirFoto(entrada.routeId, entrada.deliveryId, entrada.foto)
  }

  // 2. La novedad en sí: es lo que el coordinador va a leer y resolver.
  if (!progreso.novedadRegistrada) {
    cb.onEtapa?.('Reportando novedad…')
    await deps.crearNovedad({
      id: entrada.novedadId,
      deliveryId: entrada.deliveryId,
      tipo: entrada.tipo,
      descripcion: entrada.descripcion.trim(),
      fotoUrl: progreso.fotoPath,
    })
    progreso.novedadRegistrada = true
  }

  // 3. Evento (+GPS): deja rastro en la bitácora con hora y lugar.
  if (!progreso.eventoRegistrado) {
    cb.onEtapa?.('Registrando evento…')
    await deps.registrarEventoNovedad(entrada.deliveryId, entrada.routeId, coords)
    progreso.eventoRegistrado = true
  }

  // 4. ÚLTIMO: cerrar la entrega con novedad.
  cb.onEtapa?.('Guardando…')
  await deps.marcarConNovedad(entrada.deliveryId)

  return { coords }
}
