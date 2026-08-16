// Orquestación del cierre del cumplido.
//
// POR QUÉ VIVE FUERA DEL COMPONENTE: este es el paso más importante y menos
// perdonable de la app — si falla a medias, el conductor cree que entregó y la
// operación cree que no. Dentro de `DriverApp` estaba enredado con refs y
// estado de React, así que no había forma de probar el reintento sin montar
// toda la pantalla. Aquí las dependencias se inyectan y el orden se puede
// verificar con dobles.
//
// Lo hereda además la Fase 1.4: la cola offline necesita interceptar
// exactamente estas cuatro operaciones, y ahora son un punto único.

import type { Coords } from '@/lib/geo'

// Lo que YA se logró en intentos anteriores. Se MUTA en el sitio a propósito:
// cuando un paso falla, la función lanza, y quien llama conserva este objeto
// para que el reintento no repita lo que ya funcionó (subir dos veces la misma
// foto choca con el `upsert: false` del helper de Storage). Es la misma
// semántica que tenían los `useRef` del componente, pero inspeccionable.
export interface CumplidoProgreso {
  fotoPath: string | null
  firmaPath: string | null
  salidaRegistrada: boolean
}

export function nuevoProgreso(): CumplidoProgreso {
  return { fotoPath: null, firmaPath: null, salidaRegistrada: false }
}

export interface CumplidoEntrada {
  routeId: string
  deliveryId: string
  /** Evidencia legal. Requerida: sin foto no se cierra la entrega. */
  foto: File
  recibidoPor: string
  /** Si el conductor trazó una firma. La firma es OPCIONAL por diseño. */
  hayFirma: boolean
  /** Se resuelve al PNG de la firma; puede dar null (canvas sin contexto). */
  obtenerFirma: () => Promise<Blob | null | undefined>
}

export interface CumplidoDeps {
  subirFoto: (routeId: string, deliveryId: string, file: File) => Promise<string>
  subirFirma: (routeId: string, deliveryId: string, blob: Blob) => Promise<string>
  registrarSalida: (
    deliveryId: string,
    routeId: string,
    coords: Coords | null
  ) => Promise<void>
  marcarEntregada: (
    deliveryId: string,
    evidencia: { fotoUrl: string | null; firmaUrl: string | null; recibidoPor: string }
  ) => Promise<void>
  capturarUbicacion: () => Promise<Coords | null>
}

export interface CumplidoCallbacks {
  onEtapa?: (etapa: string) => void
  /** La firma se perdió al convertirla. No bloquea; el conductor debe saberlo. */
  onFirmaPerdida?: () => void
}

/**
 * Cierra la entrega. Lanza si algún paso falla — y en ese caso `progreso`
 * queda con lo ya logrado, de modo que volver a llamar reanuda en vez de
 * reiniciar. El estado 'entregado' es SIEMPRE el último paso: si algo revienta
 * antes, la entrega sigue 'en_punto' y es reintentable.
 */
export async function confirmarCumplido(
  entrada: CumplidoEntrada,
  progreso: CumplidoProgreso,
  deps: CumplidoDeps,
  cb: CumplidoCallbacks = {}
): Promise<{ coords: Coords | null }> {
  const coords = await deps.capturarUbicacion()

  // 1. Foto (requerida). Se salta si ya subió en un intento anterior.
  if (!progreso.fotoPath) {
    cb.onEtapa?.('Subiendo foto…')
    progreso.fotoPath = await deps.subirFoto(entrada.routeId, entrada.deliveryId, entrada.foto)
  }

  // 2. Firma (opcional). Sólo si hay trazo.
  if (!progreso.firmaPath && entrada.hayFirma) {
    cb.onEtapa?.('Subiendo firma…')
    const blob = await entrada.obtenerFirma()
    if (blob) {
      progreso.firmaPath = await deps.subirFirma(entrada.routeId, entrada.deliveryId, blob)
    } else {
      // Antes se descartaba en silencio: el conductor firmaba, veía "entregado"
      // y la firma no existía. NO se bloquea la entrega — la evidencia legal es
      // la foto de la factura sellada — pero sí se avisa.
      cb.onFirmaPerdida?.()
    }
  }

  // 3. Evento de salida (+GPS). El trigger de la BD calcula tiempo_en_punto_minutos.
  if (!progreso.salidaRegistrada) {
    cb.onEtapa?.('Registrando salida…')
    await deps.registrarSalida(entrada.deliveryId, entrada.routeId, coords)
    progreso.salidaRegistrada = true
  }

  // 4. ÚLTIMO paso: evidencia + estado 'entregado'. Este es el flip.
  cb.onEtapa?.('Guardando…')
  await deps.marcarEntregada(entrada.deliveryId, {
    fotoUrl: progreso.fotoPath,
    firmaUrl: progreso.firmaPath,
    recibidoPor: entrada.recibidoPor.trim(),
  })

  return { coords }
}
