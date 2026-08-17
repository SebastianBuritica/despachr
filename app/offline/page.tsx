import Link from 'next/link'
import { CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'

export const metadata = { title: 'Sin conexión · Despachr' }

// Último recurso del service worker: se sirve cuando el conductor abre la app
// sin señal y la ruta pedida nunca se había visitado (no hay nada cacheado).
// Lo importante que debe comunicar: lo ya registrado NO se perdió — vive en la
// cola de IndexedDB y se enviará solo.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center p-6 text-center">
      <BrandMark className="h-8 text-brand-ink" />
      <span className="mt-8 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CloudOff className="size-8" />
      </span>
      <h1 className="mt-6 text-xl font-bold tracking-tight">Sin conexión</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        No pudimos cargar esta pantalla porque no hay señal. Lo que ya registraste{' '}
        <span className="font-medium text-foreground">no se perdió</span>: está guardado en tu
        equipo y se envía solo cuando vuelva la conexión.
      </p>
      <Button className="mt-8 h-12 w-full max-w-xs" asChild>
        <Link href="/driver">Reintentar</Link>
      </Button>
    </main>
  )
}
