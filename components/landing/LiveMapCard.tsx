'use client'

import { useEffect, useRef, useState } from 'react'
import { Truck } from 'lucide-react'

// Visualización "EN VIVO" del hero — réplica del prototipo (handoff):
//  capa 1: tiles reales de Barranquilla (CARTO dark_all, z=11)
//  capa 2: overlay de legibilidad + glow + atribución
//  capa 3: ruta vial real (SVG, geometría OSRM ya proyectada a 520×440)
//  capa 4: camión recorriendo la ruta (offset-path con el mismo `d`)
//  capa 5: pines, chips, badge EN VIVO y toast (HTML absoluto)
// En producción: MapLibre/Mapbox dark + ruta de OSRM/Directions con API key propia.

const W = 520
const H = 440

// Trazado vial real (Puerto Colombia → Barranquilla → Soledad), proyectado a la card.
const ROUTE =
  'M29.8 103.7 L31.6 108.3 L40.4 112.5 L42.6 112.7 L60.1 102 L88.8 86.9 L125 81.6 L163.2 76.8 L184.5 78.6 L213.4 94 L221.8 97.5 L234.9 103.9 L242.9 107.6 L247.6 111.1 L259.9 115.4 L274.3 119.6 L284.1 121.8 L288.4 127.9 L278.6 150.2 L272.7 165.7 L274.2 177.9 L277.5 189.5 L280.4 197.2 L286.1 215.7 L295.4 223.2 L304 223.8'

// Tiles z=11 que cubren Barranquilla (x 597–599, y 960–962); subdominios a–d.
const TILES = [
  'a/597/960', 'b/598/960', 'c/599/960',
  'd/597/961', 'a/598/961', 'b/599/961',
  'c/597/962', 'd/598/962', 'a/599/962',
]

// Escala el lienzo fijo 520×440 al ancho disponible (mantiene alineadas las capas).
function ScaledBox({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full" style={{ height: H * scale }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}

export function LiveMapCard() {
  return (
    <ScaledBox>
      <div
        className="animate-float relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0f0e] shadow-[0_30px_80px_-30px_rgba(0,0,0,.85)]"
        style={{ width: W, height: H }}
      >
        {/* Capa 1 — tiles del mapa */}
        <div className="absolute inset-0 overflow-hidden bg-[#0d0f0e]">
          <div
            className="absolute grid grid-cols-3 grid-rows-3"
            style={{ left: -124, top: -164, width: 768, height: 768, filter: 'saturate(.85) contrast(1.02)' }}
          >
            {TILES.map((t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={t}
                src={`https://${t[0]}.basemaps.cartocdn.com/dark_all/11/${t.slice(2)}.png`}
                width={256}
                height={256}
                alt=""
                loading="lazy"
              />
            ))}
          </div>
        </div>

        {/* Capa 2 — overlay de legibilidad + glow + atribución */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(rgba(10,12,11,.35),rgba(10,12,11,.5)), radial-gradient(circle at 72% 28%, rgba(29,158,117,.16), transparent 58%)',
          }}
        />
        <span className="absolute bottom-1.5 right-2 font-mono text-[9px] text-white/40">
          © OpenStreetMap · CARTO
        </span>

        {/* Capa 3 — ruta vial */}
        <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
          <path d={ROUTE} stroke="rgba(148,163,184,.45)" strokeWidth="4" strokeLinecap="round" />
          <path
            d={ROUTE}
            stroke="#1D9E75"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 8"
            className="animate-dash"
          />
        </svg>

        {/* Capa 4 — camión sobre la ruta */}
        <div
          className="absolute left-0 top-0"
          style={{ offsetPath: `path('${ROUTE}')`, offsetRotate: '0deg', animation: 'routeTruck 7s ease-in-out infinite' }}
        >
          <span className="flex size-[34px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#121212] bg-[#0F6E56] text-white shadow-[0_6px_16px_rgba(15,110,86,.6)]">
            <Truck className="size-4" />
          </span>
        </div>

        {/* Capa 5 — pines */}
        <Pin x={29.8} y={103.7} className="bg-zinc-500" />
        <Pin x={213.4} y={94} amber />
        <Pin x={304} y={223.8} className="bg-[#1D9E75]" />

        {/* Badge EN VIVO */}
        <div className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-[#1D9E75]" />
          EN VIVO · 4 rutas
        </div>

        {/* Chip conductor */}
        <div
          className="absolute inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/65 px-2 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur"
          style={{ left: 318, top: 150 }}
        >
          <Truck className="size-3 text-[#1D9E75]" />
          Carlos M. · ABC-123
        </div>

        {/* Toast cíclico */}
        <div className="animate-toast absolute bottom-3 left-3 right-3">
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
    </ScaledBox>
  )
}

function Pin({ x, y, amber, className }: { x: number; y: number; amber?: boolean; className?: string }) {
  if (amber) {
    return (
      <span
        className="absolute flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{ left: x, top: y }}
      >
        <span className="absolute size-full animate-ping rounded-full bg-amber-400/60" />
        <span className="size-3.5 rounded-full border-2 border-[#0d0f0e] bg-amber-400" />
      </span>
    )
  }
  return (
    <span
      className={`absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d0f0e] ${className}`}
      style={{ left: x, top: y }}
    />
  )
}
