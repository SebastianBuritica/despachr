import { CircleCheck, Package, DollarSign, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { TonnageChart } from '@/components/dashboard/TonnageChart'
import { ComplianceRing } from '@/components/dashboard/ComplianceRing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  KPIS,
  TONNAGE_BY_DAY,
  COMPLIANCE_PCT,
  PROFITABILITY,
} from '@/lib/mock/admin'

const KPI_ICON = {
  cumplimiento: CircleCheck,
  toneladas: Package,
  facturacion: DollarSign,
  margen: TrendingUp,
} as const

const totalTons = TONNAGE_BY_DAY.reduce((s, d) => s + d.tons, 0).toFixed(1)

export default function MetricasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Desempeño de operación"
        subtitle="Esta semana · Semana del 15 al 21 de enero, 2026"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            delta={k.delta}
            up={k.up}
            icon={KPI_ICON[k.key as keyof typeof KPI_ICON]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Toneladas movilizadas por día</CardTitle>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              Total {totalTons} T
            </span>
          </CardHeader>
          <CardContent>
            <TonnageChart data={TONNAGE_BY_DAY} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm">Cumplimiento global</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            <ComplianceRing pct={COMPLIANCE_PCT} />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Rentabilidad por cliente</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Toneladas</TableHead>
              <TableHead className="text-right">Facturación</TableHead>
              <TableHead>Margen</TableHead>
              <TableHead className="text-right">Tendencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROFITABILITY.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.client}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{p.tons}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{p.revenue}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${p.margin * 2.5}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums">{p.margin}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      'inline-flex items-center justify-end gap-0.5 font-medium',
                      p.up ? 'text-brand' : 'text-destructive'
                    )}
                  >
                    {p.up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
