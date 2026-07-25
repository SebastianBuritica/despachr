import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'

// 404 del conductor: mobile-first, vuelve a su ruta del día.
export default function DriverNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <BrandMark className="h-8 text-brand dark:text-white" />
      <p className="mt-8 font-mono text-5xl font-semibold tabular-nums text-brand">404</p>
      <h1 className="mt-4 text-xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Esta pantalla no existe. Vuelve a tu ruta del día.
      </p>
      <Button className="mt-8 h-12 w-full max-w-xs" asChild>
        <Link href="/driver">Volver a mi ruta</Link>
      </Button>
    </main>
  )
}
