// Registro de eventos del conductor (delivery_events). Cada evento inserta con
// driver_id = auth.uid(); la RLS exige que la ruta sea del conductor.
//
// UNA SOLA FUENTE DE VERDAD: los triggers de la BD ya derivan el estado de la
// entrega a partir del evento —
//   llegada_punto → deliveries.hora_llegada_punto + estado 'en_punto'
//   salida_punto  → deliveries.hora_salida_punto + tiempo_en_punto_minutos
// La app NO recalcula eso: registra el evento y RE-LEE la fila (getEntregasDeRuta).
import { supabase } from '@/lib/supabase'
import type { TipoEvento } from '@/types'
import type { Coords } from '@/lib/geo'

// Identidad y hora las pone el CLIENTE, en el momento en que el conductor
// actúa. Dos razones, ambas por el modo offline (Fase 1.4):
//
//  1. IDEMPOTENCIA. `id` es la PK: reenviar un evento encolado choca con la
//     misma llave y Postgres responde 23505, que aquí se trata como éxito. Sin
//     esto, una respuesta perdida (mandado pero sin confirmación) duplicaría el
//     evento al reintentar, y con él el cálculo de tiempo_en_punto del trigger.
//  2. HORA REAL. La columna tiene default now(), es decir la hora del SERVIDOR
//     al insertar. Un conductor que llega a las 10:00 sin señal y sincroniza a
//     las 14:00 quedaría con hora_llegada_punto = 14:00 y un tiempo en punto
//     absurdo. La hora del evento es cuándo PASÓ, no cuándo se pudo enviar.
//
// CONTRAPARTIDA ACEPTADA: se confía en el reloj del dispositivo. En Android/iOS
// va sincronizado por red por defecto, y estando sin señal no hay alternativa
// mejor — la hora del servidor sería, con certeza, la equivocada.
export interface EventoIdentidad {
  id: string
  timestamp: string
}

export function nuevaIdentidadEvento(): EventoIdentidad {
  return { id: crypto.randomUUID(), timestamp: new Date().toISOString() }
}

// Código de Postgres para unique_violation.
const DUPLICADO = '23505'

export async function registrarEvento(
  tipo: TipoEvento,
  deliveryId: string,
  routeId: string,
  coords?: Coords | null,
  identidad: EventoIdentidad = nuevaIdentidadEvento()
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no disponible')

  const { error } = await supabase.from('delivery_events').insert({
    id: identidad.id,
    delivery_id: deliveryId,
    route_id: routeId,
    driver_id: user.id,
    tipo_evento: tipo,
    timestamp: identidad.timestamp,
    // Sin coordenadas: se guardan NULL. El evento vale igual (ver lib/geo.ts).
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  })

  // Ya estaba: el evento llegó en un intento anterior aunque no viéramos la
  // respuesta. Es éxito, no error — reintentar debe converger, no fallar.
  if (error && error.code !== DUPLICADO) throw error
}
