// Anillo de cumplimiento (conic-gradient verde / gris) con centro blanco.
export function ComplianceRing({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative flex size-40 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#0F6E56 ${pct}%, #E2E8F0 ${pct}% 100%)`,
        }}
      >
        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-card">
          <span className="font-mono text-2xl font-semibold tabular-nums">{pct}%</span>
          <span className="text-xs text-muted-foreground">a tiempo</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" /> A tiempo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-border" /> Fuera de ventana
        </span>
      </div>
    </div>
  )
}
