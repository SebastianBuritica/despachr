// Camino de datos del informe. La aritmética vive en `lib/cumplimiento.ts`.
//
// Filtra por la fecha de la RUTA (la semana operativa), NO por
// `fecha_programada`: si filtrara por ella, las entregas sin compromiso
// desaparecerían y `sinCompromiso` sería siempre 0 — justo el recorte silencioso
// que el cálculo intenta hacer visible.
import type { SupabaseClient } from '@supabase/supabase-js'
import { fechaOperacion } from '@/lib/fecha'
import type { EntregaInforme } from '@/lib/cumplimiento'
import type { EstadoEntrega, TipoNovedad } from '@/types'

// `routes.driver_id` referencia a `drivers.id`, y `drivers.id` (a su vez) a
// `profiles.id` — es una tabla de extensión 1:1, NO una relación directa
// routes→profiles. Pedir `routes!inner(profiles(name))` sin pasar por `drivers`
// falla en silencio del lado de PostgREST (`PGRST200: no relationship found`),
// que es justo el bug que dejó `/admin` sin cargar nunca — nadie lo vio porque
// la verificación siempre fue por SQL directo, nunca cargando la pantalla real.
interface FilaCruda {
  numero_factura: string | null
  fecha_reprogramada: string | null
  foto_cumplido_url: string | null
  routes:
    | {
        driver:
          | { profiles: { name: string | null } | null }
          | { profiles: { name: string | null } | null }[]
          | null
      }
    | {
        driver:
          | { profiles: { name: string | null } | null }
          | { profiles: { name: string | null } | null }[]
          | null
      }[]
    | null
  address: string | null
  city: string | null
  estado: EstadoEntrega
  fecha_programada: string | null
  hora_salida_punto: string | null
  observaciones: string | null
  issues: { tipo_novedad: TipoNovedad }[] | null
}

/**
 * Entregas de un cliente en la semana operativa [desde, hasta] (fechas de RUTA).
 *
 * Recibe el cliente de Supabase en vez de importarlo (misma convención que
 * `lib/cumplido.ts`): la página lo llama con el del navegador y la API con uno
 * de servidor construido desde las cookies. Sin esto habría dos copias de la
 * misma consulta, que es como se desincronizan.
 */
export async function entregasDelInforme(
  db: SupabaseClient,
  clienteId: string,
  desde: string,
  hasta: string
): Promise<EntregaInforme[]> {
  const { data, error } = await db
    .from('deliveries')
    .select(
      'address, city, estado, fecha_programada, fecha_reprogramada, numero_factura, ' +
        'hora_salida_punto, observaciones, foto_cumplido_url, ' +
        'issues(tipo_novedad), routes!inner(fecha, driver:drivers(profiles(name)))'
    )
    .eq('client_id', clienteId)
    .gte('routes.fecha', desde)
    .lte('routes.fecha', hasta)
    .order('fecha_programada', { ascending: true })

  if (error) throw error

  return (data ?? []).map((d) => {
    const f = d as unknown as FilaCruda
    const ruta = Array.isArray(f.routes) ? f.routes[0] : f.routes
    const conductor = Array.isArray(ruta?.driver) ? ruta?.driver[0] : ruta?.driver
    const perfil = Array.isArray(conductor?.profiles) ? conductor?.profiles[0] : conductor?.profiles
    return {
      factura: f.numero_factura,
      fechaReprogramada: f.fecha_reprogramada,
      fotoCumplidoUrl: f.foto_cumplido_url,
      conductor: perfil?.name ?? null,
      tienda: f.address ?? '—',
      ciudad: f.city ?? '—',
      estado: f.estado,
      fechaProgramada: f.fecha_programada,
      fechaEntrega: f.hora_salida_punto ? fechaOperacion(f.hora_salida_punto) : null,
      novedad: f.issues?.[0]?.tipo_novedad ?? null,
      observaciones: f.observaciones,
    }
  })
}
