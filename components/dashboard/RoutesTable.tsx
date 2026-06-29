'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RouteProgress } from '@/components/dashboard/RouteProgress'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROUTE_STATUS, type ActiveRoute, type RouteStatus } from '@/lib/mock/coordinator'

type Filter = 'todas' | RouteStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'en_ruta', label: 'En ruta' },
  { key: 'completada', label: 'Completadas' },
  { key: 'programada', label: 'Programadas' },
  { key: 'retrasada', label: 'Retrasadas' },
]

export function RoutesTable({ routes }: { routes: ActiveRoute[] }) {
  const [filter, setFilter] = useState<Filter>('todas')
  const rows = filter === 'todas' ? routes : routes.filter((r) => r.status === filter)

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
              <TableHead>Ruta</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.driver}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                  {r.plate}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.zone}</TableCell>
                <TableCell>
                  <RouteProgress done={r.done} total={r.total} />
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{r.departure}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{r.eta}</TableCell>
                <TableCell>
                  <StatusBadge tone={ROUTE_STATUS[r.status].tone} dot>
                    {ROUTE_STATUS[r.status].label}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
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
