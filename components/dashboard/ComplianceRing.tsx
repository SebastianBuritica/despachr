// Donut fino: conic-gradient (primary-2 / track), centro surface, leyenda con %.
export function ComplianceRing({ pct }: { pct: number }) {
  const rest = Math.round((100 - pct) * 10) / 10
  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="flex size-[148px] items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--brand-light) 0 ${pct}%, var(--track) ${pct}% 100%)`,
        }}
      >
        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-card">
          <span className="font-mono text-2xl font-semibold tabular-nums">{pct}%</span>
          <span className="text-xs text-muted-foreground">a tiempo</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-light" /> A tiempo {pct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-track" /> Fuera {rest}%
        </span>
      </div>
    </div>
  )
}
