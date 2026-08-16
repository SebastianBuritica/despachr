import {
  CircleCheck,
  TrendingUp,
  Package,
  Users,
  Download,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ComingSoon } from '@/components/ui/coming-soon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { RECENT_REPORTS } from '@/lib/mock/admin'
import { DemoDataNotice } from '@/components/ui/demo-data-notice'

interface Generator {
  key: string
  title: string
  desc: string
  icon: LucideIcon
  accent?: boolean
}

const GENERATORS: Generator[] = [
  { key: 'cumplimiento', title: 'Cumplimiento', desc: 'Entregas a tiempo por ruta, cliente y conductor.', icon: CircleCheck, accent: true },
  { key: 'rentabilidad', title: 'Rentabilidad', desc: 'Margen y facturación por cliente y periodo.', icon: TrendingUp },
  { key: 'toneladas', title: 'Toneladas', desc: 'Volumen movilizado por día, ruta y zona.', icon: Package },
  { key: 'conductores', title: 'Conductores', desc: 'Desempeño, cumplimiento y calificación.', icon: Users },
]

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <DemoDataNotice />
      <PageHeader title="Reportes" subtitle="Genera y descarga reportes de operación" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {GENERATORS.map((g) => {
          const Icon = g.icon
          return (
            <Card key={g.key} className="gap-0 p-5 shadow-card">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-md',
                  g.accent
                    ? 'bg-[#DCFCE7] text-brand dark:bg-green-500/15 dark:text-brand-light'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="size-4" />
              </span>
              <h3 className="mt-4 font-semibold">{g.title}</h3>
              <p className="mt-1 flex-1 text-[13px] text-muted-foreground">{g.desc}</p>
              <ComingSoon className="mt-4 w-full">
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Generar
                </Button>
              </ComingSoon>
            </Card>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Reportes recientes</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporte</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Generado</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RECENT_REPORTS.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.period}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                  {r.generated}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.format}</TableCell>
                <TableCell className="text-right">
                  <ComingSoon>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand disabled:opacity-50"
                    >
                      <Download className="size-4" />
                      Descargar
                    </button>
                  </ComingSoon>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
