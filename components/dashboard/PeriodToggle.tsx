'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const PERIODS = ['Hoy', 'Semana', 'Mes'] as const
type Period = (typeof PERIODS)[number]

// Segmented control visual del periodo (Hoy/Semana/Mes). Estado local.
export function PeriodToggle() {
  const [period, setPeriod] = useState<Period>('Semana')
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            period === p
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
