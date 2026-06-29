import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CLIENTS } from '@/lib/mock/coordinator'

export default function ClientesOperativosPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="5 clientes con operación esta semana" />

      <div className="rounded-lg border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-right">Rutas</TableHead>
              <TableHead className="text-right">Entregas/mes</TableHead>
              <TableHead className="text-right">On-time</TableHead>
              <TableHead>Próx. entrega</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CLIENTS.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.city}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{c.routes}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {c.monthlyDeliveries}
                </TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums text-brand">
                  {c.onTime}%
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{c.nextDelivery}</TableCell>
                <TableCell>
                  <StatusBadge tone={c.active ? 'success' : 'neutral'} dot>
                    {c.active ? 'Activo' : 'Pausado'}
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
