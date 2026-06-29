import { cn } from '@/lib/utils'

interface RouteProgressProps {
  done: number
  total: number
  className?: string
}

// Barra de progreso de ruta (pista + relleno verde) + texto "1/3" mono.
export function RouteProgress({ done, total, className }: RouteProgressProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {done}/{total}
      </span>
    </div>
  )
}
