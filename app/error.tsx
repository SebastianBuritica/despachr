'use client'

import { useEffect } from 'react'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'

// Frontera de error a nivel app. Next la monta en cliente y le pasa `reset`
// para reintentar el render del segmento que falló.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // El detalle real va al servicio de logs/consola, nunca a la UI en producción.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center">
      <BrandMark className="h-8 text-brand-ink" />
      <h1 className="mt-8 text-2xl font-bold tracking-tight">Algo salió mal</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Tuvimos un problema al cargar esta vista. Puedes reintentar; si persiste, avisa a soporte.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 max-w-md overflow-auto rounded-md border border-border bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
          {error.message}
        </pre>
      )}
      <Button className="mt-8" onClick={reset}>
        <RotateCw className="size-4" />
        Reintentar
      </Button>
    </main>
  )
}
