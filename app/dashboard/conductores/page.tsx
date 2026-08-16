import { Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DriverCard } from '@/components/dashboard/DriverCard'
import { Button } from '@/components/ui/button'
import { ComingSoon } from '@/components/ui/coming-soon'
import { EmptyState } from '@/components/ui/empty-state'
import { DRIVERS } from '@/lib/mock/coordinator'
import { DemoDataNotice } from '@/components/ui/demo-data-notice'

export default function ConductoresPage() {
  const onRoute = DRIVERS.filter((d) => d.onRoute).length

  return (
    <div className="space-y-6">
      <DemoDataNotice />
      <PageHeader
        title="Conductores"
        subtitle={`${DRIVERS.length} conductores · ${onRoute} en ruta`}
        action={
          <ComingSoon>
            <Button disabled>
              <Plus className="size-4" />
              Agregar conductor
            </Button>
          </ComingSoon>
        }
      />

      {DRIVERS.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin conductores"
          message="Aún no hay conductores registrados para tu operación."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DRIVERS.map((d) => (
            <DriverCard key={d.id} driver={d} />
          ))}
        </div>
      )}
    </div>
  )
}
