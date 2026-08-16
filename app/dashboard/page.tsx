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
import { LiveClock } from '@/components/dashboard/LiveClock'
import { ACTIVE_ROUTES, LIVE_ALERTS, routeBadge } from '@/lib/mock/coordinator'

const liveRoutes = ACTIVE_ROUTES.filter((r) => r.status !== 'pendiente').slice(0, 4)

// Derivadas de la misma lista que pinta la tabla. Estaban escritas a mano y
// tres de las cuatro mentían (Completadas decía 1 con 2 rutas completadas;
// Paradas hoy decía 20 con 27 paradas). Cuando esto pase a Supabase en la
// Fase 2 cambia la FUENTE, no el cálculo.
const enRuta = ACTIVE_ROUTES.filter((r) => r.status === 'en_curso').length
const completadas = ACTIVE_ROUTES.filter((r) => r.status === 'completada').length
const paradasHoy = ACTIVE_ROUTES.reduce((total, r) => total + r.total, 0)
// 'retrasada' no es un estado del schema: es condición derivada (ver el mock).
const retrasadas = ACTIVE_ROUTES.filter((r) => r.retrasada).length

export default function OperacionEnVivoPage() {
  return (
    <div className="space-y-6">
      {/* "Actualizado hace 12 s" se quitó a propósito: no hay refresco real en
          esta vista todavía (mock, sin Realtime hasta la Fase 2), así que era
          una afirmación falsa sobre la frescura del dato. */}
      <PageHeader
        title="Operación en vivo"
        subtitle={<LiveClock />}
        action={
          <StatusBadge tone="success" dot>
            {enRuta} {enRuta === 1 ? 'ruta activa' : 'rutas activas'}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <LiveMap />

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
                  {(() => {
                    const badge = routeBadge(r)
                    return (
                      <StatusBadge tone={badge.tone} dot>
                        {badge.label}
                      </StatusBadge>
                    )
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
