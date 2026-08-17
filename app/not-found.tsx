import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'

// 404 de marca. Sin volcado de rutas: solo un camino claro de vuelta.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center">
      <BrandMark className="h-8 text-brand-ink" />
      <p className="mt-8 font-mono text-5xl font-semibold tabular-nums text-brand-ink">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        La ruta que buscas no existe o fue movida.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  )
}
