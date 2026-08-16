import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  // ReactNode y no string: el subtítulo a veces es un componente vivo
  // (p. ej. <LiveClock/> en la operación en vivo), no sólo texto.
  subtitle?: ReactNode
  action?: ReactNode
}

// Header de página estándar: título 24px/700 + subtítulo, con acción opcional a la derecha.
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
