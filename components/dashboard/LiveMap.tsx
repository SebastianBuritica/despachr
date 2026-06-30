import { Truck, AlertTriangle } from 'lucide-react'

// Placeholder estilizado del mapa (grid CSS + paths SVG + pines).
// En producción se integra un mapa real (Mapbox / Google Maps / Leaflet).
export function LiveMap() {
  return (
    <div className="relative h-[380px] overflow-hidden rounded-lg border border-border bg-card shadow-card">
      {/* Grid de fondo (usa el token de borde para adaptarse al modo) */}
      <div
        className="absolute inset-0 text-border"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, currentColor 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 40px)',
        }}
      />

      {/* Rutas */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 600 380" fill="none" preserveAspectRatio="none">
        <path d="M70 330 C 160 300, 200 200, 300 200 S 470 150, 560 90" stroke="#0F6E56" strokeWidth="3" fill="none" />
        <path d="M120 110 C 200 160, 260 240, 360 270 S 500 320, 560 330" stroke="#D97706" strokeWidth="3" strokeDasharray="7 7" fill="none" />
      </svg>

      {/* Pin conductor activo (verde) */}
      <div className="absolute left-[46%] top-[48%]">
        <div className="absolute -left-2 -top-9 whitespace-nowrap rounded-md bg-card px-2 py-1 text-[11px] font-medium text-foreground shadow-card">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-brand" />
          Carlos M. · ABC-123
        </div>
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-brand text-white shadow-card">
          <Truck className="size-3.5" />
        </span>
      </div>

      {/* Parada pendiente (gris) */}
      <span className="absolute right-[8%] top-[20%] size-3.5 rounded-full border-2 border-card bg-faint shadow-card" />

      {/* Alerta (rojo) */}
      <div className="absolute bottom-[16%] left-[52%]">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#FEF2F2] px-2 py-1 text-[11px] font-medium text-[#DC2626] shadow-card dark:bg-red-600/20 dark:text-[#F87171]">
          ⚠ Retrasada 35 min
        </div>
        <span className="block size-3.5 rounded-full border-2 border-card bg-destructive shadow-card" />
      </div>

      {/* Badge MAPA EN VIVO */}
      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-panel px-2.5 py-1 text-[11px] font-semibold text-panel-foreground">
        <span className="size-1.5 animate-ping rounded-full bg-brand-light" />
        MAPA EN VIVO
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md bg-card/90 px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-card backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" /> En ruta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-faint" /> Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="size-3 text-destructive" /> Retrasada
        </span>
      </div>
    </div>
  )
}
