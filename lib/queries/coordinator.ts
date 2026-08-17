// Capa de datos del COORDINADOR. Camino propio, separado del conductor.
//
// NO REUSAR `entregas_de_ruta`: esa RPC es del conductor por construcción
// (filtra por `driver_id = auth.uid()`), así que para el coordinador devolvería
// vacío siempre. Aquí no hace falta RPC: la RLS ya le concede SELECT directo
// sobre routes, deliveries, drivers, profiles y clients — lo único que no ve
// son las tablas financieras (delivery_financials, client_invoices), que están
// aparte justo por eso.
//
// QUÉ NO EXISTE EN EL SCHEMA (y por qué esto no lo inventa):
//   · `routes` no tiene nombre ni zona → se derivan las CIUDADES de sus entregas.
//   · No hay ETA en ninguna parte. Estimar una salida de la nada sería exactamente
//     el tipo de dato falso que este proyecto viene quitando; la optimización de
//     rutas es post-v1. Se muestra la hora de salida REAL (`hora_inicio`).
//   · No hay "cumplimiento" ni "rating" de conductor: exigen una hora objetivo
//     por entrega que el schema no guarda. Se reemplazan por métricas derivables
//     de verdad (tiempo promedio en punto, novedades).
import { supabase } from '@/lib/supabase'
import { hoyOperacion, minutosDesde, MINUTOS_EN_PUNTO_ALERTA } from '@/lib/fecha'
import type { EstadoEntrega, EstadoRuta } from '@/types'

// PostgREST tipa una relación a-uno como objeto o arreglo según el caso.
function unir<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export interface EntregaCoordinador {
  id: string
  secuencia: number
  cliente: string
  direccion: string
  ciudad: string
  estado: EstadoEntrega
  horaLlegada: string | null
  horaSalida: string | null
  tiempoEnPuntoMin: number | null
  latitude: number | null
  longitude: number | null
}

export interface RutaCoordinador {
  id: string
  fecha: string
  estado: EstadoRuta
  conductorId: string
  conductor: string
  placa: string | null
  telefono: string | null
  horaInicio: string | null
  horaFin: string | null
  entregas: EntregaCoordinador[]
  hechas: number
  total: number
  /** Ciudades de sus puntos, sin repetir — sustituye al "nombre" inventado. */
  ciudades: string[]
  /**
   * Derivado, NO es un estado del schema: hay una entrega parada en el punto
   * más de 60 min. Mismo umbral que la edge function de alertas, a propósito —
   * si difirieran, el tablero y las alertas se contradirían.
   */
  retrasada: boolean
}

interface FilaRuta {
  id: string
  fecha: string
  estado: EstadoRuta
  driver_id: string
  hora_inicio: string | null
  hora_fin: string | null
  drivers:
    | { license_plate: string | null; phone_number: string | null; profiles: { name: string } | { name: string }[] | null }
    | { license_plate: string | null; phone_number: string | null; profiles: { name: string } | { name: string }[] | null }[]
    | null
  deliveries:
    | {
        id: string
        numero_secuencia: number
        address: string
        city: string
        estado: EstadoEntrega
        hora_llegada_punto: string | null
        hora_salida_punto: string | null
        tiempo_en_punto_minutos: number | null
        latitude: number | null
        longitude: number | null
        clients: { name: string } | { name: string }[] | null
      }[]
    | null
}

const SELECT_RUTA = `
  id, fecha, estado, driver_id, hora_inicio, hora_fin,
  drivers ( license_plate, phone_number, profiles ( name ) ),
  deliveries (
    id, numero_secuencia, address, city, estado,
    hora_llegada_punto, hora_salida_punto, tiempo_en_punto_minutos,
    latitude, longitude,
    clients ( name )
  )
`

function mapearRuta(row: FilaRuta): RutaCoordinador {
  const driver = unir(row.drivers)
  const perfil = unir(driver?.profiles ?? null)

  const entregas: EntregaCoordinador[] = (row.deliveries ?? [])
    .map((d) => ({
      id: d.id,
      secuencia: d.numero_secuencia,
      // LEFT join implícito: un client_id huérfano no debe hacer desaparecer la entrega.
      cliente: unir(d.clients)?.name ?? '—',
      direccion: d.address,
      ciudad: d.city,
      estado: d.estado,
      horaLlegada: d.hora_llegada_punto,
      horaSalida: d.hora_salida_punto,
      tiempoEnPuntoMin: d.tiempo_en_punto_minutos,
      latitude: d.latitude === null ? null : Number(d.latitude),
      longitude: d.longitude === null ? null : Number(d.longitude),
    }))
    .sort((a, b) => a.secuencia - b.secuencia)

  const cerradas: EstadoEntrega[] = ['entregado', 'no_entregado', 'novedad']

  return {
    id: row.id,
    fecha: row.fecha,
    estado: row.estado,
    conductorId: row.driver_id,
    conductor: perfil?.name ?? '—',
    placa: driver?.license_plate ?? null,
    telefono: driver?.phone_number ?? null,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    entregas,
    hechas: entregas.filter((e) => cerradas.includes(e.estado)).length,
    total: entregas.length,
    ciudades: [...new Set(entregas.map((e) => e.ciudad))],
    retrasada: entregas.some(
      (e) =>
        e.estado === 'en_punto' &&
        (minutosDesde(e.horaLlegada) ?? 0) > MINUTOS_EN_PUNTO_ALERTA
    ),
  }
}

/** Rutas de un día (por defecto hoy) con conductor y entregas. */
export async function getRutasDelDia(fecha = hoyOperacion()): Promise<RutaCoordinador[]> {
  const { data, error } = await supabase
    .from('routes')
    .select(SELECT_RUTA)
    .eq('fecha', fecha)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as unknown as FilaRuta[]).map(mapearRuta)
}

export interface ConductorCoordinador {
  id: string
  nombre: string
  placa: string | null
  telefono: string | null
  activo: boolean
  /** Ruta de HOY, si tiene. */
  enRuta: boolean
  ciudades: string[]
  hechas: number
  total: number
  /** Promedio de minutos en punto hoy — señal real de ritmo, no un "rating". */
  promedioEnPuntoMin: number | null
  novedades: number
}

export async function getConductores(): Promise<ConductorCoordinador[]> {
  const [{ data: filas, error }, rutas] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, license_plate, phone_number, is_active, profiles ( name )')
      .order('created_at', { ascending: true }),
    getRutasDelDia(),
  ])

  if (error) throw error

  const porConductor = new Map(rutas.map((r) => [r.conductorId, r]))

  return (
    (filas ?? []) as unknown as {
      id: string
      license_plate: string | null
      phone_number: string | null
      is_active: boolean
      profiles: { name: string } | { name: string }[] | null
    }[]
  ).map((d) => {
    const ruta = porConductor.get(d.id)
    const tiempos = (ruta?.entregas ?? [])
      .map((e) => e.tiempoEnPuntoMin)
      .filter((m): m is number => m !== null)

    return {
      id: d.id,
      nombre: unir(d.profiles)?.name ?? '—',
      placa: d.license_plate,
      telefono: d.phone_number,
      activo: d.is_active,
      enRuta: ruta?.estado === 'en_curso',
      ciudades: ruta?.ciudades ?? [],
      hechas: ruta?.hechas ?? 0,
      total: ruta?.total ?? 0,
      promedioEnPuntoMin: tiempos.length
        ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
        : null,
      novedades: (ruta?.entregas ?? []).filter((e) => e.estado === 'novedad').length,
    }
  })
}

export interface ClienteCoordinador {
  id: string
  nombre: string
  ciudad: string
  departamento: string
  tipoServicio: string | null
  contacto: string | null
  /** Entregas de este cliente en las rutas de hoy. */
  entregasHoy: number
  rutasHoy: number
}

// El coordinador ve `clients` por RLS (incluye tarifa_flete, que sí le
// corresponde); lo que nunca ve es el pago al transportista ni el margen, que
// viven en delivery_financials. Aquí igual no se pide la tarifa: esta pantalla
// es operativa, no comercial.
export async function getClientesOperativos(): Promise<ClienteCoordinador[]> {
  const [{ data: filas, error }, rutas] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, city, department, tipo_servicio, contact_person')
      .order('name', { ascending: true }),
    getRutasDelDia(),
  ])

  if (error) throw error

  // Se cuenta por NOMBRE porque las entregas ya vienen con el nombre resuelto.
  const entregasPorCliente = new Map<string, { entregas: number; rutas: Set<string> }>()
  for (const r of rutas) {
    for (const e of r.entregas) {
      const acc = entregasPorCliente.get(e.cliente) ?? { entregas: 0, rutas: new Set<string>() }
      acc.entregas++
      acc.rutas.add(r.id)
      entregasPorCliente.set(e.cliente, acc)
    }
  }

  return (
    (filas ?? []) as {
      id: string
      name: string
      city: string
      department: string
      tipo_servicio: string | null
      contact_person: string | null
    }[]
  ).map((c) => {
    const acc = entregasPorCliente.get(c.name)
    return {
      id: c.id,
      nombre: c.name,
      ciudad: c.city,
      departamento: c.department,
      tipoServicio: c.tipo_servicio,
      contacto: c.contact_person,
      entregasHoy: acc?.entregas ?? 0,
      rutasHoy: acc?.rutas.size ?? 0,
    }
  })
}


export interface PosicionRuta {
  routeId: string
  latitude: number
  longitude: number
  timestamp: string
}

/**
 * Última posición conocida por ruta.
 *
 * NO hay tabla de tracking: el schema no guarda la posición del vehículo en
 * continuo. Lo que sí existe son las coordenadas de los EVENTOS del conductor
 * (llegada, salida, novedad), capturadas por `lib/geo.ts`. La última de esas es
 * el mejor "dónde va" disponible — y es un dato real, no una interpolación. Por
 * eso la UI muestra la hora: una posición de hace tres horas no es "ahora".
 */
export async function getUltimasPosiciones(routeIds: string[]): Promise<PosicionRuta[]> {
  if (routeIds.length === 0) return []

  const { data, error } = await supabase
    .from('delivery_events')
    .select('route_id, latitude, longitude, timestamp')
    .in('route_id', routeIds)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('timestamp', { ascending: false })

  if (error) throw error

  // Se queda la primera de cada ruta: el order ya las trajo de más nueva a más vieja.
  const vistas = new Map<string, PosicionRuta>()
  for (const row of (data ?? []) as {
    route_id: string
    latitude: number
    longitude: number
    timestamp: string
  }[]) {
    if (!vistas.has(row.route_id)) {
      vistas.set(row.route_id, {
        routeId: row.route_id,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        timestamp: row.timestamp,
      })
    }
  }
  return [...vistas.values()]
}

export interface OperacionEnVivo {
  rutas: RutaCoordinador[]
  posiciones: PosicionRuta[]
}

export async function getOperacionEnVivo(): Promise<OperacionEnVivo> {
  const rutas = await getRutasDelDia()
  const posiciones = await getUltimasPosiciones(rutas.map((r) => r.id))
  return { rutas, posiciones }
}
