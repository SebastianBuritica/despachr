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

export async function registrarEvento(
  tipo: TipoEvento,
  deliveryId: string,
  routeId: string,
  coords?: Coords | null
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no disponible')

  const { error } = await supabase.from('delivery_events').insert({
    delivery_id: deliveryId,
    route_id: routeId,
    driver_id: user.id,
    tipo_evento: tipo,
    // Sin coordenadas: se guardan NULL. El evento vale igual (ver lib/geo.ts).
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  })

  if (error) throw error
}
