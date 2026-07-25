// Capa de datos de la app del conductor. Lee de Supabase con la sesión del
// conductor autenticado. La RLS del schema es la que garantiza la seguridad
// (routes/deliveries filtran por driver_id = auth.uid()); estos filtros son
// para UX, no para seguridad — un conductor solo puede leer lo suyo aunque
// pidiera otra ruta.
import { supabase } from '@/lib/supabase'
import type { EstadoRuta, EstadoEntrega } from '@/types'

// Vista de la ruta del día para el header del conductor.
export interface RutaDelDia {
  id: string
  fecha: string
  estado: EstadoRuta
  placa: string | null
}

// Vista de una entrega para las tarjetas/pantallas del conductor. Solo los
// campos que la UI del conductor necesita (sin flete: es dato del coordinador).
export interface EntregaConductor {
  id: string
  routeId: string
  secuencia: number
  cliente: string
  direccion: string
  ciudad: string
  telefono: string | null
  estado: EstadoEntrega
  horaLlegada: string | null
}

// Fecha "hoy" en la zona de la operación (Colombia, sin horario de verano).
// Se compara contra routes.fecha (columna date). Usar la zona de operación
// evita que, de noche, el desfase UTC muestre la ruta del día equivocado.
function hoyOperacion(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

// La ruta de HOY del conductor autenticado. `null` si no tiene ruta hoy
// (dispara el estado vacío de la UI). Si hubiera más de una, toma la primera
// creada — el modelo operativo es una ruta por conductor por día.
export async function getRutaDelDia(): Promise<RutaDelDia | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('routes')
    .select('id, fecha, estado, drivers(license_plate)')
    .eq('driver_id', user.id)
    .eq('fecha', hoyOperacion())
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  // drivers es una relación a-uno; PostgREST puede tiparla como objeto o arreglo.
  const drivers = data.drivers as { license_plate: string | null } | { license_plate: string | null }[] | null
  const placa = Array.isArray(drivers) ? (drivers[0]?.license_plate ?? null) : (drivers?.license_plate ?? null)

  return {
    id: data.id,
    fecha: data.fecha,
    estado: data.estado as EstadoRuta,
    placa,
  }
}

// Entregas de una ruta, ordenadas por numero_secuencia (el "orden de entrega"
// del punto), con el nombre del cliente y el teléfono del receptor.
export async function getEntregasDeRuta(routeId: string): Promise<EntregaConductor[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select(
      'id, route_id, numero_secuencia, address, city, telefono_receptor, estado, hora_llegada_punto, clients(name)'
    )
    .eq('route_id', routeId)
    .order('numero_secuencia', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const clients = row.clients as { name: string } | { name: string }[] | null
    const cliente = Array.isArray(clients) ? (clients[0]?.name ?? '—') : (clients?.name ?? '—')
    return {
      id: row.id,
      routeId: row.route_id,
      secuencia: row.numero_secuencia,
      cliente,
      direccion: row.address,
      ciudad: row.city,
      telefono: row.telefono_receptor,
      estado: row.estado as EstadoEntrega,
      horaLlegada: row.hora_llegada_punto,
    }
  })
}

// Marca la entrega como entregada. El estado 'entregado' NO lo pone ningún
// trigger (los triggers solo derivan hora_llegada/en_punto y hora_salida/tiempo
// desde los eventos); cerrar la entrega es responsabilidad de la app. Esto, a su
// vez, dispara check_route_completion en la BD si es el último punto.
export async function marcarEntregada(deliveryId: string): Promise<void> {
  const { error } = await supabase
    .from('deliveries')
    .update({ estado: 'entregado' })
    .eq('id', deliveryId)
  if (error) throw error
}
