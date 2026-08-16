import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { RoutesTable } from '@/components/dashboard/RoutesTable'
import { Button } from '@/components/ui/button'
import { ComingSoon } from '@/components/ui/coming-soon'
import { ACTIVE_ROUTES } from '@/lib/mock/coordinator'
import { DemoDataNotice } from '@/components/ui/demo-data-notice'

export default function RutasPage() {
  const enRuta = ACTIVE_ROUTES.filter((r) => r.status === 'en_curso').length
  const completadas = ACTIVE_ROUTES.filter((r) => r.status === 'completada').length
  const pendientes = ACTIVE_ROUTES.filter((r) => r.status === 'pendiente').length
  // Retraso es derivado, no un estado del schema.
  const retrasadas = ACTIVE_ROUTES.filter((r) => r.retrasada).length

  return (
    <div className="space-y-6">
      <DemoDataNotice />
      <PageHeader
        title="Rutas"
        subtitle={`${ACTIVE_ROUTES.length} rutas programadas hoy · Lunes 15 de enero`}
        action={
          <ComingSoon>
            <Button disabled>
              <Plus className="size-4" />
              Nueva ruta
            </Button>
          </ComingSoon>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="En ruta" value={enRuta} />
        <StatCard label="Completadas" value={completadas} />
        <StatCard label="Pendientes" value={pendientes} tone="warning" />
        <StatCard label="Retrasadas" value={retrasadas} tone="danger" />
      </div>

      <RoutesTable routes={ACTIVE_ROUTES} />
    </div>
  )
}
