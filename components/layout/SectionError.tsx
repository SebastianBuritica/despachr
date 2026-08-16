'use client'

import { useEffect } from 'react'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  section: string
}

// Frontera de error DENTRO del DashboardShell: el sidebar y el topbar siguen
// montados (el layout no falló), así que esto ocupa sólo el área de contenido y
// el usuario puede navegar a otra sección en vez de quedarse en una pantalla
// muerta. `app/error.tsx` cubre el caso de pantalla completa.
export function SectionError({ error, reset, section }: SectionErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">No pudimos cargar {section}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Puedes reintentar, o moverte a otra sección desde el menú.
        </p>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="max-w-md overflow-auto rounded-md border border-border bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
          {error.message}
        </pre>
      )}
      <Button onClick={reset}>
        <RotateCw className="size-4" />
        Reintentar
      </Button>
    </div>
  )
}
