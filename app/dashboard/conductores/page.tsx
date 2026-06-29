import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DriverCard } from '@/components/dashboard/DriverCard'
import { Button } from '@/components/ui/button'
import { DRIVERS } from '@/lib/mock/coordinator'

export default function ConductoresPage() {
  const onRoute = DRIVERS.filter((d) => d.onRoute).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conductores"
        subtitle={`${DRIVERS.length} conductores · ${onRoute} en ruta`}
        action={
          <Button>
            <Plus className="size-4" />
            Agregar conductor
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DRIVERS.map((d) => (
          <DriverCard key={d.id} driver={d} />
        ))}
      </div>
    </div>
  )
}
