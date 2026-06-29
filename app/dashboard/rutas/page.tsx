import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { RoutesTable } from '@/components/dashboard/RoutesTable'
import { Button } from '@/components/ui/button'
import { ACTIVE_ROUTES } from '@/lib/mock/coordinator'

export default function RutasPage() {
  const enRuta = ACTIVE_ROUTES.filter((r) => r.status === 'en_ruta').length
  const completadas = ACTIVE_ROUTES.filter((r) => r.status === 'completada').length
  const programadas = ACTIVE_ROUTES.filter((r) => r.status === 'programada').length
  const retrasadas = ACTIVE_ROUTES.filter((r) => r.status === 'retrasada').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rutas"
        subtitle={`${ACTIVE_ROUTES.length} rutas programadas hoy · Lunes 15 de enero`}
        action={
          <Button>
            <Plus className="size-4" />
            Nueva ruta
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="En ruta" value={enRuta} />
        <StatCard label="Completadas" value={completadas} />
        <StatCard label="Programadas" value={programadas} tone="warning" />
        <StatCard label="Retrasadas" value={retrasadas} tone="danger" />
      </div>

      <RoutesTable routes={ACTIVE_ROUTES} />
    </div>
  )
}
