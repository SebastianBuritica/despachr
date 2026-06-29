import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { LiveMap } from '@/components/dashboard/LiveMap'
import { AlertsCard } from '@/components/dashboard/AlertsCard'
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
import { ACTIVE_ROUTES, LIVE_ALERTS, ROUTE_STATUS } from '@/lib/mock/coordinator'

const liveRoutes = ACTIVE_ROUTES.filter((r) => r.status !== 'programada').slice(0, 4)

export default function OperacionEnVivoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operación en vivo"
        subtitle="Lunes 15 de enero · 11:24 a. m. · Actualizado hace 12 s"
        action={
          <StatusBadge tone="success" dot>
            4 rutas activas
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <LiveMap />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="En ruta" value="3" />
            <StatCard label="Completadas" value="1" />
            <StatCard label="Paradas hoy" value="20" />
            <StatCard label="Retrasadas" value="1" tone="danger" />
          </div>
          <AlertsCard alerts={LIVE_ALERTS} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Rutas activas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ruta</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveRoutes.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.driver}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                  {r.plate}
                </TableCell>
                <TableCell>
                  <RouteProgress done={r.done} total={r.total} />
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{r.eta}</TableCell>
                <TableCell>
                  <StatusBadge tone={ROUTE_STATUS[r.status].tone} dot>
                    {ROUTE_STATUS[r.status].label}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
