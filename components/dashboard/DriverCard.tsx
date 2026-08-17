import { Route as RouteIcon, TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import type { ConductorCoordinador } from '@/lib/queries/coordinator'

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

// MÉTRICAS: antes mostraba "cumplimiento" y "rating", que no existen en el
// schema — un rating de conductor era invención pura, y el cumplimiento exige
// una hora objetivo por entrega que no se guarda en ninguna parte. Se
// reemplazaron por tres cosas que sí se derivan de los datos reales: avance de
// hoy, tiempo promedio en punto (ritmo) y novedades reportadas.
export function DriverCard({ driver }: { driver: ConductorCoordinador }) {
  return (
    <Card className="gap-0 p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarFallback
            className={cn(
              'text-sm font-semibold text-white',
              driver.enRuta ? 'bg-brand' : 'bg-faint'
            )}
          >
            {initials(driver.nombre)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{driver.nombre}</p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {driver.placa ?? 'Sin placa'}
          </p>
        </div>
        <StatusBadge tone={driver.enRuta ? 'success' : 'neutral'} dot>
          {driver.enRuta ? 'En ruta' : driver.activo ? 'Disponible' : 'Inactivo'}
        </StatusBadge>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <RouteIcon className="size-4 shrink-0" />
        <span className="truncate">
          {driver.ciudades.length ? driver.ciudades.join(' · ') : 'Sin ruta hoy'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
        <div>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {driver.hechas}/{driver.total}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Entregas hoy</p>
        </div>
        <div>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {driver.promedioEnPuntoMin === null ? '—' : `${driver.promedioEnPuntoMin}m`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Prom. en punto</p>
        </div>
        <div>
          <p
            className={cn(
              'flex items-center justify-center gap-1 font-mono text-sm font-semibold tabular-nums',
              driver.novedades > 0 && 'text-destructive'
            )}
          >
            {driver.novedades > 0 && <TriangleAlert className="size-3.5" />}
            {driver.novedades}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Novedades</p>
        </div>
      </div>
    </Card>
  )
}
