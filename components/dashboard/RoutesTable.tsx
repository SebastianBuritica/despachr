'use client'

import { useState } from 'react'
import { Route as RouteIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RouteProgress } from '@/components/dashboard/RouteProgress'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { rutaBadge, horaCorta } from '@/lib/estados'
import type { RutaCoordinador } from '@/lib/queries/coordinator'
import type { EstadoRuta } from '@/types'

// 'retrasada' es un filtro derivado (no un EstadoRuta); el resto son estados del schema.
type Filter = 'todas' | EstadoRuta | 'retrasada'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'en_curso', label: 'En ruta' },
  { key: 'completada', label: 'Completadas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'retrasada', label: 'Retrasadas' },
]

export function RoutesTable({ routes }: { routes: RutaCoordinador[] }) {
  const [filter, setFilter] = useState<Filter>('todas')

  // Sin rutas programadas: estado vacío completo (no la tabla con filtros vacíos).
  if (routes.length === 0) {
    return (
      <EmptyState
        icon={RouteIcon}
        title="Sin rutas programadas"
        message="Cuando armes la malla de la semana, las rutas del día aparecerán aquí."
      />
    )
  }

  const rows =
    filter === 'todas'
      ? routes
      : filter === 'retrasada'
        ? routes.filter((r) => r.retrasada)
        : routes.filter((r) => r.estado === filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.key
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conductor</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.conductor}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                  {r.placa ?? '—'}
                </TableCell>
                {/* Las ciudades de sus puntos sustituyen al "nombre" y la "zona"
                    que el mock inventaba: `routes` no tiene ninguno de los dos. */}
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {r.ciudades.join(' · ') || '—'}
                </TableCell>
                <TableCell>
                  <RouteProgress done={r.hechas} total={r.total} />
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {horaCorta(r.horaInicio)}
                </TableCell>
                {/* Antes decía ETA. No hay ETA en el schema y estimarla sería
                    inventar; se muestra el cierre REAL (hora_fin). */}
                <TableCell className="font-mono text-xs tabular-nums">
                  {horaCorta(r.horaFin)}
                </TableCell>
                <TableCell>
                  {(() => {
                    const badge = rutaBadge(r)
                    return (
                      <StatusBadge tone={badge.tone} dot>
                        {badge.label}
                      </StatusBadge>
                    )
                  })()}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No hay rutas en este estado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
