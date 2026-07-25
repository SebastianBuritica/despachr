'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Envuelve un control aún no construido (botón/entrada deshabilitado) para que
// se lea como "por venir" y no como roto. El hijo debe ir `disabled`: los
// elementos deshabilitados no emiten eventos de puntero, así que el `span`
// contenedor actúa como disparador del tooltip. Pasa `className` (p. ej.
// `w-full`) cuando el control envuelto ocupa todo el ancho.
export function ComingSoon({
  children,
  label = 'Próximamente',
  className,
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('inline-flex cursor-not-allowed', className)}
          tabIndex={0}
          aria-label={label}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
