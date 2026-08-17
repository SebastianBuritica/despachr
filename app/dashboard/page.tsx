'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { LiveMap } from '@/components/dashboard/LiveMap'
import { AlertsCard } from '@/components/dashboard/AlertsCard'
import { RouteProgress } from '@/components/dashboard/RouteProgress'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionSkeleton } from '@/components/layout/SectionSkeleton'
import { LiveClock } from '@/components/dashboard/LiveClock'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Route as RouteIcon, WifiOff } from 'lucide-react'
import { useCallback } from 'react'
import { useCoordinadorData } from '@/hooks/useCoordinadorData'
import { getOperacionEnVivo } from '@/lib/queries/coordinator'
import { getAlertasActivas } from '@/lib/queries/alerts'
import { rutaBadge, horaCorta } from '@/lib/estados'

export default function OperacionEnVivoPage() {
  // Una sola consulta para rutas + posiciones + alertas: las tres se refrescan
  // con los mismos cambios de Realtime, así que separar las suscripciones sólo
  // dejaría el mapa y las alertas desfasados del tablero.
  const cargar = useCallback(async () => {
    const [operacion, alertas] = await Promise.all([getOperacionEnVivo(), getAlertasActivas()])
    return { ...operacion, alertas }
  }, [])

  const { data, loading, error, syncDown, refetch } = useCoordinadorData(
    cargar,
    'coord-operacion'
  )
  if (error) throw error
  if (loading || !data) return <SectionSkeleton />

  const { rutas, posiciones, alertas } = data
  const enRuta = rutas.filter((r) => r.estado === 'en_curso').length
  const completadas = rutas.filter((r) => r.estado === 'completada').length
  const paradasHoy = rutas.reduce((total, r) => total + r.total, 0)
  const retrasadas = rutas.filter((r) => r.retrasada).length
  const enCurso = rutas.filter((r) => r.estado !== 'pendiente')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operación en vivo"
        subtitle={<LiveClock />}
        action={
          <div className="flex items-center gap-2">
            {syncDown && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <WifiOff className="size-3.5" />
                Sync caído
              </span>
            )}
            <StatusBadge tone={enRuta > 0 ? 'success' : 'neutral'} dot>
              {enRuta} {enRuta === 1 ? 'ruta activa' : 'rutas activas'}
            </StatusBadge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <LiveMap rutas={rutas} posiciones={posiciones} />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="En ruta" value={enRuta} />
            <StatCard label="Completadas" value={completadas} />
            <StatCard label="Paradas hoy" value={paradasHoy} />
            <StatCard
              label="Retrasadas"
              value={retrasadas}
              tone={retrasadas > 0 ? 'danger' : 'default'}
            />
          </div>
          {/* Reales: la tabla `alerts` la llena la edge function
              check-tiempo-en-punto. Mientras esté sin desplegar, la lista sale
              vacía — que es la verdad, no un error. */}
          <AlertsCard alerts={alertas} onResuelta={() => refetch(true)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Rutas en curso</h2>
        </div>
        {enCurso.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={RouteIcon}
              title="Ninguna ruta ha salido todavía"
              message="Cuando un conductor inicie su ruta del día, la verás aquí en vivo."
            />
          </div>
        ) : (
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Conductor</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enCurso.map((r) => {
                const badge = rutaBadge(r)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.conductor}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                      {r.placa ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {r.ciudades.join(' · ') || '—'}
                    </TableCell>
                    <TableCell>
                      <RouteProgress done={r.hechas} total={r.total} />
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {horaCorta(r.horaInicio)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={badge.tone} dot>
                        {badge.label}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
