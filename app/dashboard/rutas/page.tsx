'use client'

import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { RoutesTable } from '@/components/dashboard/RoutesTable'
import { Button } from '@/components/ui/button'
import { ComingSoon } from '@/components/ui/coming-soon'
import { SectionSkeleton } from '@/components/layout/SectionSkeleton'
import { useCoordinadorData } from '@/hooks/useCoordinadorData'
import { getRutasDelDia } from '@/lib/queries/coordinator'

export default function RutasPage() {
  const { data, loading, error } = useCoordinadorData(getRutasDelDia, 'coord-rutas')
  if (error) throw error
  if (loading || !data) return <SectionSkeleton />

  const enRuta = data.filter((r) => r.estado === 'en_curso').length
  const completadas = data.filter((r) => r.estado === 'completada').length
  const pendientes = data.filter((r) => r.estado === 'pendiente').length
  // Retraso es derivado, no un estado del schema (ver lib/queries/coordinator).
  const retrasadas = data.filter((r) => r.retrasada).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rutas"
        subtitle={`${data.length} ${data.length === 1 ? 'ruta programada' : 'rutas programadas'} hoy`}
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
        <StatCard label="Pendientes" value={pendientes} tone={pendientes > 0 ? 'warning' : 'default'} />
        <StatCard label="Retrasadas" value={retrasadas} tone={retrasadas > 0 ? 'danger' : 'default'} />
      </div>

      <RoutesTable routes={data} />
    </div>
  )
}
