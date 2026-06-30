import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatTone = 'default' | 'danger' | 'warning'

interface StatCardProps {
  label: string
  value: ReactNode
  tone?: StatTone
  icon?: ReactNode
}

const TONE: Record<StatTone, { card: string; value: string }> = {
  default: { card: 'border-border bg-card', value: 'text-foreground' },
  danger: { card: 'border-destructive/20 bg-destructive/5', value: 'text-destructive' },
  warning: {
    card: 'border-[#FDE68A] bg-[#FEF9C3] dark:border-amber-500/25 dark:bg-amber-500/10',
    value: 'text-[#B45309] dark:text-[#FBBF24]',
  },
}

// Card de métrica: label + valor grande mono. Reutilizada en live ops, rutas y admin.
export function StatCard({ label, value, tone = 'default', icon }: StatCardProps) {
  const t = TONE[tone]
  return (
    <div className={cn('rounded-lg border p-4 shadow-card', t.card)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={cn('mt-2 font-mono text-2xl font-semibold tabular-nums', t.value)}>{value}</p>
    </div>
  )
}
