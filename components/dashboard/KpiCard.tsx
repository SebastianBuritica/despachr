import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  delta: string
  up: boolean
  icon: LucideIcon
}

export function KpiCard({ label, value, delta, up, icon: Icon }: KpiCardProps) {
  const Arrow = up ? TrendingUp : TrendingDown
  return (
    <Card className="gap-0 p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-mono text-[30px] font-semibold leading-none tabular-nums">{value}</p>
      <p
        className={cn(
          'mt-3 flex items-center gap-1 text-xs font-medium',
          up ? 'text-brand' : 'text-destructive'
        )}
      >
        <Arrow className="size-3.5" />
        {delta}
      </p>
    </Card>
  )
}
