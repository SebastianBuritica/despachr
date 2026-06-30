import { cn } from '@/lib/utils'

// Sistema de badges del handoff (fondo / texto):
//  success → bg #DCFCE7 / #0F6E56  ·  neutral → #F1F5F9 / #64748B
//  danger  → #FEF2F2 / #DC2626     ·  warning → #FFFBEB / #D97706
export type StatusTone = 'success' | 'neutral' | 'danger' | 'warning'

const TONE: Record<StatusTone, string> = {
  success: 'bg-[#DCFCE7] text-[#0F6E56] dark:bg-green-500/15 dark:text-[#4ADE80]',
  neutral: 'bg-muted text-muted-foreground',
  danger: 'bg-[#FEF2F2] text-[#DC2626] dark:bg-red-600/15 dark:text-[#F87171]',
  warning: 'bg-[#FEF9C3] text-[#B45309] dark:bg-amber-600/15 dark:text-[#FBBF24]',
}

interface StatusBadgeProps {
  tone: StatusTone
  children: React.ReactNode
  dot?: boolean
  className?: string
}

export function StatusBadge({ tone, children, dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
