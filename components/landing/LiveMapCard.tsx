import { Truck } from 'lucide-react'

// Visualización "EN VIVO" del hero. Mapa oscuro estilizado (placeholder) con
// ruta animada, vehículo recorriéndola, pines, chips y toast cíclico.
// En producción: tiles reales (Mapbox/MapTiler dark) + ruta de OSRM/Directions.
const ROUTE = 'M 60 360 C 130 330, 170 250, 270 240 S 410 205, 470 120'

export function LiveMapCard() {
  return (
    <div className="animate-float [animation-delay:.2s]">
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)]">
        <div className="relative aspect-[520/440] w-full">
          {/* Fondo del mapa */}
          <div className="absolute inset-0 bg-[#0b0e0d]" />
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 44px)',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_10%,rgba(29,158,117,.12),transparent_60%)]" />

          {/* Ruta + vehículo */}
          <svg className="absolute inset-0 size-full" viewBox="0 0 520 440" fill="none">
            <path id="hero-route" d={ROUTE} stroke="#3f3f46" strokeWidth="5" strokeLinecap="round" />
            <path
              d={ROUTE}
              stroke="#1D9E75"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 8"
              className="animate-dash"
            />
            <g>
              <circle r="17" fill="#1D9E75" opacity="0.22" />
              <circle r="11" fill="#0F6E56" stroke="#0b0e0d" strokeWidth="2" />
              <animateMotion dur="7s" repeatCount="indefinite" calcMode="linear">
                <mpath href="#hero-route" />
              </animateMotion>
            </g>
          </svg>

          {/* Vehículo: icono encima del marcador (sincronía visual con el dot SVG) */}
          {/* Pines (posicionados por % sobre el viewBox 520x440) */}
          {/* origen */}
          <span className="absolute left-[11.5%] top-[81.8%] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0e0d] bg-zinc-500" />
          {/* parada intermedia (ámbar + ping) */}
          <span className="absolute left-[55.8%] top-[53.4%] flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="absolute size-full animate-ping rounded-full bg-amber-400/60" />
            <span className="size-3.5 rounded-full border-2 border-[#0b0e0d] bg-amber-400" />
          </span>
          {/* destino */}
          <span className="absolute left-[90.4%] top-[27.3%] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0e0d] bg-[#1D9E75]" />

          {/* Badge EN VIVO */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-[#1D9E75]" />
            EN VIVO · 4 rutas
          </div>

          {/* Chip conductor */}
          <div className="absolute left-[40%] top-[34%] inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur">
            <Truck className="size-3 text-[#1D9E75]" />
            Carlos M. · ABC-123
          </div>

          {/* Toast cíclico */}
          <div className="absolute bottom-3 left-3 right-3 animate-toast">
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-[#18181b]/95 px-3 py-2 shadow-xl backdrop-blur">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#0F6E56]">
                <Truck className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Entrega confirmada · Makro Montería</p>
                <p className="truncate text-[11px] text-zinc-400">
                  cumplido + firma · <span className="font-mono">11:32</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
