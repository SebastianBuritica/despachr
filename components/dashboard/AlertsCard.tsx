import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LiveAlert } from '@/lib/mock/coordinator'

const ICON_TONE = {
  danger: 'text-destructive',
  warning: 'text-[#B45309] dark:text-[#FBBF24]',
} as const

const ROW_TONE = {
  danger: 'bg-destructive/5',
  warning: 'bg-[#FEF9C3] dark:bg-amber-500/10',
} as const

export function AlertsCard({ alerts }: { alerts: LiveAlert[] }) {
  return (
    <Card className="gap-0 py-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <CardTitle className="text-sm">Alertas</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">{alerts.length} activas</span>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {alerts.map((a) => (
          <div key={a.id} className={cn('flex gap-2.5 rounded-md p-2.5', ROW_TONE[a.tone])}>
            <AlertTriangle className={cn('mt-0.5 size-4 shrink-0', ICON_TONE[a.tone])} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-snug">{a.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
