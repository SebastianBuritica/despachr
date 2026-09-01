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

interface FilaCruda {
  numero_factura: string | null
  routes: { profiles: { name: string | null } | null } | { profiles: { name: string | null } | null }[] | null
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
      'address, city, estado, fecha_programada, numero_factura, hora_salida_punto, ' +
        'observaciones, issues(tipo_novedad), routes!inner(fecha, profiles(name))'
    )
    .eq('client_id', clienteId)
    .gte('routes.fecha', desde)
    .lte('routes.fecha', hasta)
    .order('fecha_programada', { ascending: true })

  if (error) throw error

  return (data ?? []).map((d) => {
    const f = d as unknown as FilaCruda
    const ruta = Array.isArray(f.routes) ? f.routes[0] : f.routes
    const perfil = Array.isArray(ruta?.profiles) ? ruta?.profiles[0] : ruta?.profiles
    return {
      factura: f.numero_factura,
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
