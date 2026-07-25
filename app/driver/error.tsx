'use client'

import { useEffect } from 'react'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'

// Frontera de error del conductor: mobile-first, sin shell de dashboard.
export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <BrandMark className="h-8 text-brand dark:text-white" />
      <h1 className="mt-8 text-xl font-bold tracking-tight">Algo salió mal</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        No pudimos cargar tu ruta. Revisa tu conexión y reintenta.
      </p>
      <Button className="mt-8 h-12 w-full max-w-xs" onClick={reset}>
        <RotateCw className="size-4" />
        Reintentar
      </Button>
    </main>
  )
}
