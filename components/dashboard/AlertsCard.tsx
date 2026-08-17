'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { horaCorta } from '@/lib/estados'
import { resolverAlerta, type Alerta, type TipoAlerta } from '@/lib/queries/alerts'

// Tono por tipo: el tiempo en punto es lo que hace perder la ventana de entrega,
// así que va en rojo; el resto avisa sin gritar.
const TONO: Record<TipoAlerta, { fila: string; icono: string }> = {
  tiempo_en_punto: { fila: 'bg-destructive/5', icono: 'text-destructive' },
  ruta_no_iniciada: {
    fila: 'bg-[#FEF9C3] dark:bg-amber-500/10',
    icono: 'text-[#B45309] dark:text-[#FBBF24]',
  },
  novedad: { fila: 'bg-destructive/5', icono: 'text-destructive' },
}

export function AlertsCard({
  alerts,
  onResuelta,
}: {
  alerts: Alerta[]
  onResuelta: () => void | Promise<void>
}) {
  const [resolviendo, setResolviendo] = useState<string | null>(null)

  const resolver = async (id: string) => {
    setResolviendo(id)
    try {
      await resolverAlerta(id)
      await onResuelta()
    } catch {
      toast.error('No se pudo resolver la alerta. Inténtalo de nuevo.')
    } finally {
      setResolviendo(null)
    }
  }

  return (
    <Card className="gap-0 py-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <CardTitle className="text-sm">Alertas</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          {alerts.length} {alerts.length === 1 ? 'activa' : 'activas'}
        </span>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {alerts.length === 0 ? (
          // Cero alertas es una BUENA noticia, no un estado vacío triste.
          <p className="px-1 py-3 text-center text-[13px] text-muted-foreground">
            Nada que atender ahora mismo.
          </p>
        ) : (
          alerts.map((a) => {
            const tono = TONO[a.tipo]
            return (
              <div key={a.id} className={cn('flex gap-2.5 rounded-md p-2.5', tono.fila)}>
                <AlertTriangle className={cn('mt-0.5 size-4 shrink-0', tono.icono)} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug">{a.mensaje}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[a.conductor, a.ciudad].filter(Boolean).join(' · ') || 'Sin detalle'} ·{' '}
                    {horaCorta(a.creadaEn)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => resolver(a.id)}
                  disabled={resolviendo === a.id}
                  aria-label="Marcar como resuelta"
                  title="Marcar como resuelta"
                >
                  {resolviendo === a.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                </Button>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
