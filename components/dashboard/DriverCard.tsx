import { Route as RouteIcon, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import type { DriverCard as DriverCardData } from '@/lib/mock/coordinator'

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function DriverCard({ driver }: { driver: DriverCardData }) {
  return (
    <Card className="gap-0 p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarFallback
            className={cn(
              'text-sm font-semibold text-white',
              driver.onRoute ? 'bg-brand' : 'bg-slate-400'
            )}
          >
            {initials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{driver.name}</p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">{driver.plate}</p>
        </div>
        <StatusBadge tone={driver.onRoute ? 'success' : 'neutral'} dot>
          {driver.onRoute ? 'En ruta' : 'Disponible'}
        </StatusBadge>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <RouteIcon className="size-4 shrink-0" />
        <span className="truncate">{driver.route ?? 'Sin ruta asignada'}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
        <div>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {driver.done}/{driver.total}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Entregas</p>
        </div>
        <div>
          <p className="font-mono text-sm font-semibold tabular-nums text-brand">
            {driver.compliance}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Cumplimiento</p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-1 font-mono text-sm font-semibold tabular-nums">
            <Star className="size-3.5 fill-[#D97706] text-[#D97706]" />
            {driver.rating}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Rating</p>
        </div>
      </div>
    </Card>
  )
}
