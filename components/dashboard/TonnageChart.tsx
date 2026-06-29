import type { DayTonnage } from '@/lib/mock/admin'

// Barras CSS con gradiente verde; valor mono encima de cada barra.
export function TonnageChart({ data }: { data: DayTonnage[] }) {
  const max = Math.max(...data.map((d) => d.tons))
  return (
    <div className="flex h-[200px] items-end gap-3">
      {data.map((d) => (
        <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{d.tons}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-brand to-brand-light"
              style={{ height: `${(d.tons / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  )
}
