'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Map as MapIcon } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { PosicionRuta, RutaCoordinador } from '@/lib/queries/coordinator'
import type { EstadoEntrega } from '@/types'
import { horaCorta } from '@/lib/estados'

// Tiles de CARTO: gratis, sin token y sin cuenta de facturación — la landing ya
// los usa. MapLibre (no Mapbox GL) por lo mismo: licencia libre y sin token.
function estilo(oscuro: boolean): maplibregl.StyleSpecification {
  const variante = oscuro ? 'dark_all' : 'light_all'
  return {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: ['a', 'b', 'c'].map(
          (s) => `https://${s}.basemaps.cartocdn.com/${variante}/{z}/{x}/{y}.png`
        ),
        tileSize: 256,
        attribution: '© OpenStreetMap · CARTO',
      },
    },
    layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
  }
}

// Colores por estado de la entrega. Se usan los mismos tokens de marca que el
// resto del tablero para que el mapa no parezca otra aplicación.
const COLOR_ENTREGA: Record<EstadoEntrega, string> = {
  entregado: '#0F6E56',
  en_punto: '#D97706',
  pendiente: '#71717A',
  novedad: '#DC2626',
  no_entregado: '#DC2626',
}

function pin(color: string, size = 14): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:pointer`
  return el
}

function camion(): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText =
    'width:26px;height:26px;border-radius:9999px;background:#0F6E56;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center'
  el.innerHTML =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'
  return el
}

export function LiveMap({
  rutas,
  posiciones,
}: {
  rutas: RutaCoordinador[]
  posiciones: PosicionRuta[]
}) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<maplibregl.Map | null>(null)
  const marcadores = useRef<maplibregl.Marker[]>([])
  const { resolvedTheme } = useTheme()
  const oscuro = resolvedTheme === 'dark'

  const puntos = rutas.flatMap((r) =>
    r.entregas
      .filter((e) => e.latitude !== null && e.longitude !== null)
      .map((e) => ({ ruta: r, entrega: e }))
  )
  const hayGeo = puntos.length > 0 || posiciones.length > 0

  useEffect(() => {
    if (!contenedor.current || !hayGeo) return

    const map = new maplibregl.Map({
      container: contenedor.current,
      style: estilo(oscuro),
      center: [-74.08, 4.65], // Bogotá, sólo hasta que fitBounds ajuste
      zoom: 5,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapa.current = map

    map.on('load', () => {
      const bounds = new maplibregl.LngLatBounds()

      for (const { ruta, entrega } of puntos) {
        const lngLat: [number, number] = [entrega.longitude!, entrega.latitude!]
        const m = new maplibregl.Marker({ element: pin(COLOR_ENTREGA[entrega.estado]) })
          .setLngLat(lngLat)
          .setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
              `<div style="font:500 12px/1.4 system-ui;color:#18181B">
                 <strong>${entrega.cliente}</strong><br/>
                 ${entrega.direccion}, ${entrega.ciudad}<br/>
                 <span style="color:#52525B">Punto #${entrega.secuencia} · ${ruta.conductor}</span>
               </div>`
            )
          )
          .addTo(map)
        marcadores.current.push(m)
        bounds.extend(lngLat)
      }

      for (const p of posiciones) {
        const ruta = rutas.find((r) => r.id === p.routeId)
        const lngLat: [number, number] = [p.longitude, p.latitude]
        const m = new maplibregl.Marker({ element: camion() })
          .setLngLat(lngLat)
          .setPopup(
            new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
              `<div style="font:500 12px/1.4 system-ui;color:#18181B">
                 <strong>${ruta?.conductor ?? 'Conductor'}</strong> · ${ruta?.placa ?? '—'}<br/>
                 <span style="color:#52525B">Último reporte ${horaCorta(p.timestamp)}</span>
               </div>`
            )
          )
          .addTo(map)
        marcadores.current.push(m)
        bounds.extend(lngLat)
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 })
      }
    })

    return () => {
      marcadores.current.forEach((m) => m.remove())
      marcadores.current = []
      map.remove()
      mapa.current = null
    }
    // `puntos` y `posiciones` se recrean en cada render; se depende de su
    // CONTENIDO serializado para no re-montar el mapa en cada tick de Realtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oscuro, JSON.stringify(puntos.map((p) => [p.entrega.id, p.entrega.estado])), JSON.stringify(posiciones)])

  // Sin una sola coordenada no se pinta un mapa vacío que parezca roto: se dice
  // por qué está vacío. Pasa cuando el GPS del conductor no dio permiso o
  // cuando las entregas se cargaron sin lat/lon.
  if (!hayGeo) {
    return (
      <div className="flex h-[380px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-card">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MapIcon className="size-6" />
        </span>
        <div>
          <p className="text-sm font-semibold">Sin posiciones todavía</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            El mapa se dibuja con las coordenadas de las entregas y de los eventos del conductor.
            Aparecerán cuando las rutas del día tengan ubicación.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[380px] overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div ref={contenedor} className="size-full" />
    </div>
  )
}
