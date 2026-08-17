// Presentación de los estados del schema. Vivían en `lib/mock/coordinator.ts`;
// al conectar datos reales dejan de ser mock y pasan a ser constantes de UI.
import type { StatusTone } from '@/components/ui/status-badge'
import type { EstadoRuta } from '@/types'

export const RUTA_UI: Record<EstadoRuta, { label: string; tone: StatusTone }> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  en_curso: { label: 'En ruta', tone: 'success' },
  completada: { label: 'Completada', tone: 'neutral' },
  cancelada: { label: 'Cancelada', tone: 'neutral' },
}

// 'retrasada' NO es un estado del schema: una ruta demorada sigue 'en_curso'.
// Es condición derivada (una entrega >60 min en el punto) y se pinta ENCIMA
// del estado real.
export function rutaBadge(r: { estado: EstadoRuta; retrasada: boolean }): {
  label: string
  tone: StatusTone
} {
  if (r.retrasada) return { label: 'Retrasada', tone: 'danger' }
  return RUTA_UI[r.estado]
}

// Hora corta en la zona de la operación. `null` → guion, nunca una hora inventada.
export function horaCorta(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}
