// Alertas operativas. Las INSERTA la edge function `check-tiempo-en-punto` con
// service role; el coordinador sólo lee y resuelve — por eso la tabla no tiene
// policy de INSERT para él (migración 002), y por eso aquí no hay `crear`.
import { supabase } from '@/lib/supabase'

export type TipoAlerta = 'tiempo_en_punto' | 'ruta_no_iniciada' | 'novedad'

export interface Alerta {
  id: string
  deliveryId: string
  routeId: string
  tipo: TipoAlerta
  mensaje: string
  creadaEn: string
  conductor: string | null
  ciudad: string | null
}

interface FilaAlerta {
  id: string
  delivery_id: string
  route_id: string
  tipo: TipoAlerta
  mensaje: string
  created_at: string
  deliveries: { city: string } | { city: string }[] | null
  routes:
    | { drivers: { profiles: { name: string } | { name: string }[] } | null }
    | { drivers: { profiles: { name: string } | { name: string }[] } | null }[]
    | null
}

function unir<T>(rel: T | T[] | null | undefined): T | null {
  if (rel === null || rel === undefined) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export async function getAlertasActivas(): Promise<Alerta[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select(
      `id, delivery_id, route_id, tipo, mensaje, created_at,
       deliveries ( city ),
       routes ( drivers ( profiles ( name ) ) )`
    )
    .eq('resuelta', false)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as FilaAlerta[]).map((a) => {
    const ruta = unir(a.routes)
    const perfil = unir(ruta?.drivers?.profiles ?? null)
    return {
      id: a.id,
      deliveryId: a.delivery_id,
      routeId: a.route_id,
      tipo: a.tipo,
      mensaje: a.mensaje,
      creadaEn: a.created_at,
      conductor: perfil?.name ?? null,
      ciudad: unir(a.deliveries)?.city ?? null,
    }
  })
}

/**
 * Marca la alerta como resuelta. Deja constancia de QUIÉN y CUÁNDO: una alerta
 * que desaparece sin dueño no sirve para revisar después qué pasó ese día.
 */
export async function resolverAlerta(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('alerts')
    .update({
      resuelta: true,
      resuelta_por: user?.id ?? null,
      resuelta_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}
