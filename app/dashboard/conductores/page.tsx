'use client'

import { Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DriverCard } from '@/components/dashboard/DriverCard'
import { Button } from '@/components/ui/button'
import { ComingSoon } from '@/components/ui/coming-soon'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionSkeleton } from '@/components/layout/SectionSkeleton'
import { useCoordinadorData } from '@/hooks/useCoordinadorData'
import { getConductores } from '@/lib/queries/coordinator'

export default function ConductoresPage() {
  const { data, loading, error } = useCoordinadorData(getConductores, 'coord-conductores')
  if (error) throw error
  if (loading || !data) return <SectionSkeleton />

  const enRuta = data.filter((d) => d.enRuta).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conductores"
        subtitle={`${data.length} ${data.length === 1 ? 'conductor' : 'conductores'} · ${enRuta} en ruta hoy`}
        action={
          <ComingSoon>
            <Button disabled>
              <Plus className="size-4" />
              Agregar conductor
            </Button>
          </ComingSoon>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin conductores"
          message="Aún no hay conductores registrados para tu operación."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <DriverCard key={d.id} driver={d} />
          ))}
        </div>
      )}
    </div>
  )
}
