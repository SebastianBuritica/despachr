import { cn } from '@/lib/utils'

// Símbolo oficial "Ruta-D". El asta y el nodo origen usan `currentColor`
// (controlado por la clase de texto del contenedor): verde sobre fondo claro,
// blanco sobre fondo oscuro. El recorrido punteado y el nodo destino van en
// verde de marca fijo (#1D9E75).
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      className={cn('h-7 w-auto', className)}
      role="img"
      aria-label="Despachr"
    >
      <path
        d="M11 8C28 8 35 15 35 24C35 33 28 40 11 40"
        stroke="#1D9E75"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeDasharray="0.1 7.2"
      />
      <path d="M11 8V40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="11" cy="8" r="4" fill="currentColor" />
      <circle cx="11" cy="40" r="4" fill="#1D9E75" />
    </svg>
  )
}
