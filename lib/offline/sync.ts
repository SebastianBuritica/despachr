// Cableado real de la cola contra Supabase/Storage. Vive aparte de `cola.ts`
// para que la lógica de orden y reintento se pueda probar con dobles, sin red.

import { confirmarCumplido } from '@/lib/cumplido'
import { reportarNovedad } from '@/lib/novedad'
import { registrarEvento } from '@/lib/queries/events'
import { marcarEntregada } from '@/lib/queries/driver'
import { crearNovedad, marcarConNovedad } from '@/lib/queries/issues'
import { uploadCumplido, uploadFirma, uploadNovedad } from '@/lib/storage'
import {
  actualizarProgreso,
  procesarCola,
  type ColaDeps,
  type PendienteCumplido,
  type PendienteNovedad,
  type ResultadoSync,
} from '@/lib/offline/cola'

// Storage recibe File; lo encolado es Blob (lo que sobrevive a IndexedDB).
function comoArchivo(blob: Blob, nombre: string): File {
  return blob instanceof File ? blob : new File([blob], nombre, { type: blob.type })
}

const deps: ColaDeps = {
  enviarEvento: (p) =>
    registrarEvento(p.tipoEvento, p.deliveryId, p.routeId, p.coords, {
      id: p.id,
      timestamp: p.timestamp,
    }),

  enviarCumplido: async (p: PendienteCumplido) => {
    await confirmarCumplido(
      {
        routeId: p.routeId,
        deliveryId: p.deliveryId,
        foto: comoArchivo(p.foto, 'cumplido.jpg'),
        recibidoPor: p.recibidoPor,
        hayFirma: !!p.firma,
        obtenerFirma: async () => p.firma,
      },
      p.progreso,
      {
        subirFoto: uploadCumplido,
        subirFirma: uploadFirma,
        registrarSalida: (deliveryId, routeId, coords) =>
          // Con la identidad guardada: reenviar no duplica el evento, y la hora
          // es la de la entrega, no la del sync.
          registrarEvento('salida_punto', deliveryId, routeId, coords, p.salida),
        marcarEntregada,
        // DELIBERADO: la ubicación es la que se capturó AL ENTREGAR, no una
        // lectura nueva. Al sincronizar, el conductor puede estar 50 km más
        // allá; leer el GPS aquí registraría la entrega en el lugar equivocado.
        capturarUbicacion: async () => p.coords,
      }
    ).catch(async (e) => {
      // Guarda lo que sí avanzó (p. ej. la foto ya subida) antes de propagar,
      // para que el siguiente intento no la vuelva a subir.
      await actualizarProgreso(p, p.progreso)
      throw e
    })
  },

  enviarNovedad: async (p: PendienteNovedad) => {
    await reportarNovedad(
      {
        novedadId: p.id,
        routeId: p.routeId,
        deliveryId: p.deliveryId,
        tipo: p.tipoNovedad,
        descripcion: p.descripcion,
        foto: p.foto ? comoArchivo(p.foto, 'novedad.jpg') : null,
      },
      p.progreso,
      {
        subirFoto: uploadNovedad,
        crearNovedad,
        registrarEventoNovedad: (deliveryId, routeId, coords) =>
          registrarEvento('novedad', deliveryId, routeId, coords, p.evento),
        marcarConNovedad,
        // Igual que en el cumplido: la ubicación es la de CUANDO pasó.
        capturarUbicacion: async () => p.coords,
      }
    ).catch(async (e) => {
      await actualizarProgreso(p, p.progreso)
      throw e
    })
  },
}

export function sincronizar(): Promise<ResultadoSync> {
  return procesarCola(deps)
}
