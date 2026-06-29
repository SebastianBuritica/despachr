import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CLIENT_ACCOUNTS, CLIENT_SUMMARY } from '@/lib/mock/admin'

export default function ClientesGestionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Cartera de clientes y contratos activos"
        action={
          <Button>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes totales" value={CLIENT_SUMMARY.total} />
        <StatCard label="Activos" value={CLIENT_SUMMARY.active} />
        <StatCard label="Toneladas / mes" value={CLIENT_SUMMARY.monthlyTons} />
        <StatCard label="Facturación / mes" value={CLIENT_SUMMARY.monthlyRevenue} />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead className="text-right">Ton./mes</TableHead>
              <TableHead className="text-right">Facturación</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CLIENT_ACCOUNTS.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.city}</TableCell>
                <TableCell className="text-muted-foreground">{c.contact}</TableCell>
                <TableCell className="text-muted-foreground">{c.contract}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{c.tons}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{c.revenue}</TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums text-brand">
                  {c.margin}%
                </TableCell>
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
