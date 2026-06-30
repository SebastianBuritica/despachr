import { cn } from '@/lib/utils'
import type { DayTonnage } from '@/lib/mock/admin'

// Barras minimal: una sola línea base, barra de pico resaltada (resto a 0.5),
// valor mono encima y labels del eje en faint.
export function TonnageChart({ data }: { data: DayTonnage[] }) {
  const max = Math.max(...data.map((d) => d.tons))
  return (
    <div>
      <div className="flex h-[200px] items-end gap-2 border-b border-border">
        {data.map((d) => {
          const peak = d.tons === max
          return (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-2">
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {d.tons}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={cn(
                    'w-[62%] max-w-[30px] rounded-t-[5px] bg-brand transition-[height] duration-500',
                    peak ? 'opacity-100' : 'opacity-50'
                  )}
                  style={{ height: `${(d.tons / max) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.day} className="flex-1 text-center text-xs text-faint">
            {d.day}
          </span>
        ))}
      </div>
    </div>
  )
}
