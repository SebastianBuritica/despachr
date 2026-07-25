import { Skeleton } from '@/components/ui/skeleton'

// Estado de carga a nivel app. Esqueleto genérico y con la misma escala del
// sistema de diseño, listo para cuando lleguen los fetches reales (Fase 1+).
export default function Loading() {
  return (
    <div className="min-h-dvh space-y-6 bg-background p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  )
}
