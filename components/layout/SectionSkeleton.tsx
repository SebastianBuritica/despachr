import { Skeleton } from '@/components/ui/skeleton'

// Esqueleto del ÁREA DE CONTENIDO (el shell ya está pintado: sidebar + topbar
// vienen del layout, que no se re-renderiza en una navegación de segmento).
// Imita la forma común de estas páginas — PageHeader, fila de tarjetas, bloque
// ancho — para que la transición no salte cuando llegan los datos.
export function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-[380px] rounded-lg" />
    </div>
  )
}
