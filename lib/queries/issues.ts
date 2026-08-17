// Novedades (issues): lo que sale mal en un punto — rechazo, faltante,
// mercancía dañada, cliente ausente, dirección errada.
//
// DECISIÓN DE NEGOCIO: una novedad CIERRA la entrega. No es un estado
// intermedio del que se sale reintentando; el conductor no se queda en el punto
// esperando. Queda `deliveries.estado = 'novedad'` (terminal, igual que
// 'entregado') y el trigger check_route_completion ya lo cuenta como cerrado,
// así que la ruta puede completarse con novedades dentro. Resolverla es trabajo
// del coordinador, no del conductor.
import { supabase } from '@/lib/supabase'
import type { TipoNovedad } from '@/types'

const DUPLICADO = '23505'

export interface NuevaNovedad {
  /** Id de cliente: reenviar desde la cola offline no duplica la novedad. */
  id: string
  deliveryId: string
  tipo: TipoNovedad
  descripcion: string
  fotoUrl: string | null
}

export async function crearNovedad(n: NuevaNovedad): Promise<void> {
  const { error } = await supabase.from('issues').insert({
    id: n.id,
    delivery_id: n.deliveryId,
    tipo_novedad: n.tipo,
    descripcion: n.descripcion,
    foto_novedad_url: n.fotoUrl,
  })
  if (error && error.code !== DUPLICADO) throw error
}

// Cierra la entrega con novedad. Igual que `marcarEntregada`, es el ÚLTIMO paso
// y es idempotente (un UPDATE con los mismos valores).
export async function marcarConNovedad(deliveryId: string): Promise<void> {
  const { error } = await supabase
    .from('deliveries')
    .update({ estado: 'novedad' })
    .eq('id', deliveryId)
  if (error) throw error
}
