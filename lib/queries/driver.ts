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
  // Evidencia del cumplido (migración 006). Paths en el bucket 'cumplidos'.
  fotoUrl: string | null
  firmaUrl: string | null
  recibidoPor: string | null
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

// Fila que devuelve la RPC public.entregas_de_ruta (columnas en lista blanca).
interface EntregaRpcRow {
  id: string
  route_id: string
  numero_secuencia: number
  address: string
  city: string
  telefono_receptor: string | null
  estado: EstadoEntrega
  hora_llegada_punto: string | null
  cliente_nombre: string | null
  foto_cumplido_url: string | null
  firma_url: string | null
  recibido_por: string | null
}

// Entregas de una ruta, ordenadas por numero_secuencia, con el nombre del
// cliente. Va por RPC SECURITY DEFINER (migración 005): el conductor no puede
// leer public.clients por RLS (row-level → filtraría tarifa_flete), así que la
// función devuelve SOLO columnas seguras y valida que la ruta sea suya.
export async function getEntregasDeRuta(routeId: string): Promise<EntregaConductor[]> {
  const { data, error } = await supabase.rpc('entregas_de_ruta', { p_route_id: routeId })

  if (error) throw error

  return ((data ?? []) as EntregaRpcRow[]).map((row) => ({
    id: row.id,
    routeId: row.route_id,
    secuencia: row.numero_secuencia,
    cliente: row.cliente_nombre ?? '—',
    direccion: row.address,
    ciudad: row.city,
    telefono: row.telefono_receptor,
    estado: row.estado,
    horaLlegada: row.hora_llegada_punto,
    fotoUrl: row.foto_cumplido_url,
    firmaUrl: row.firma_url,
    recibidoPor: row.recibido_por,
  }))
}

export interface EvidenciaCumplido {
  fotoUrl: string | null
  firmaUrl: string | null
  recibidoPor: string
}

// Cierra la entrega: persiste la evidencia y marca estado 'entregado' en un solo
// update. El estado 'entregado' NO lo pone ningún trigger (los triggers solo
// derivan hora_llegada/en_punto y hora_salida/tiempo desde los eventos); cerrar
// la entrega es responsabilidad de la app. Es el ÚLTIMO paso del cumplido — así,
// si la subida de evidencia falla antes, la entrega sigue 'en_punto' y se puede
// reintentar. Esto, además, dispara check_route_completion si es el último punto.
export async function marcarEntregada(
  deliveryId: string,
  evidencia: EvidenciaCumplido
): Promise<void> {
  const { error } = await supabase
    .from('deliveries')
    .update({
      foto_cumplido_url: evidencia.fotoUrl,
      firma_url: evidencia.firmaUrl,
      recibido_por: evidencia.recibidoPor,
      estado: 'entregado',
    })
    .eq('id', deliveryId)
  if (error) throw error
}
