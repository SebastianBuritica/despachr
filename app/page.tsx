import Link from 'next/link'
import { Truck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-[7px] bg-primary text-primary-foreground">
          <Truck className="size-5" />
        </span>
        <span className="text-xl font-semibold tracking-tight">Despachr</span>
      </div>

      <div className="max-w-xl space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Toda tu operación de carga, en tiempo real.
        </h1>
        <p className="text-muted-foreground">
          Conductores, rutas y cumplimiento sincronizados — desde el primer despacho hasta la
          última entrega.
        </p>
      </div>

      <Button asChild size="lg">
        <Link href="/login">
          Acceder
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </main>
  )
}
