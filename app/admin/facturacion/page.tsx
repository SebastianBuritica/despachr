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
import { INVOICES, INVOICE_STATUS, BILLING_SUMMARY } from '@/lib/mock/admin'

export default function FacturacionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación"
        subtitle="Enero 2026 · COP"
        action={
          <Button>
            <Plus className="size-4" />
            Generar factura
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total facturado" value={BILLING_SUMMARY.billed} />
        <StatCard label="Cobrado" value={<span className="text-brand">{BILLING_SUMMARY.collected}</span>} />
        <StatCard label="Pendiente" value={BILLING_SUMMARY.pending} tone="warning" />
        <StatCard label="Vencido" value={BILLING_SUMMARY.overdue} tone="danger" />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs tabular-nums font-medium">
                  {inv.id}
                </TableCell>
                <TableCell className="font-medium">{inv.client}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                  {inv.issued}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                  {inv.due}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{inv.amount}</TableCell>
                <TableCell>
                  <StatusBadge tone={INVOICE_STATUS[inv.status].tone} dot>
                    {INVOICE_STATUS[inv.status].label}
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
