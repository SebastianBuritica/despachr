import { Skeleton } from '@/components/ui/skeleton'

// Carga del conductor: esqueleto del header oscuro + tarjetas de entrega.
export default function DriverLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="space-y-4 rounded-b-[22px] bg-panel px-5 pb-5 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 bg-white/10" />
          <Skeleton className="h-5 w-44 bg-white/10" />
          <Skeleton className="h-3 w-56 bg-white/10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full bg-white/10" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
