'use client'

import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionSkeleton } from '@/components/layout/SectionSkeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCoordinadorData } from '@/hooks/useCoordinadorData'
import { getClientesOperativos } from '@/lib/queries/coordinator'

const SERVICIO: Record<string, string> = {
  paqueteo: 'Paqueteo',
  consolidado: 'Consolidado',
  exclusivo: 'Exclusivo',
}

export default function ClientesOperativosPage() {
  const { data, loading, error } = useCoordinadorData(getClientesOperativos, 'coord-clientes')
  if (error) throw error
  if (loading || !data) return <SectionSkeleton />

  const conOperacion = data.filter((c) => c.entregasHoy > 0).length

  return (
    <div className="space-y-6">
      {/* Antes esta tabla mostraba "Entregas/mes", "On-time" y "Próx. entrega".
          Ninguna se puede derivar hoy: on-time exige una hora objetivo por
          entrega que el schema no guarda, y la próxima entrega depende de la
          malla futura (Fase 2 / migración 008). Se muestran las columnas que sí
          son ciertas. */}
      <PageHeader
        title="Clientes"
        subtitle={`${data.length} ${data.length === 1 ? 'cliente' : 'clientes'} · ${conOperacion} con entregas hoy`}
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin clientes"
          message="Cuando registres clientes, aparecerán aquí con su operación del día."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-card">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Rutas hoy</TableHead>
                <TableHead className="text-right">Entregas hoy</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.ciudad}
                    <span className="text-faint"> · {c.departamento}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.contacto ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.tipoServicio ? (SERVICIO[c.tipoServicio] ?? c.tipoServicio) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{c.rutasHoy}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {c.entregasHoy}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={c.entregasHoy > 0 ? 'success' : 'neutral'} dot>
                      {c.entregasHoy > 0 ? 'Con operación' : 'Sin operación hoy'}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
