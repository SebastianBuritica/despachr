# Landing page — Despachr · Handoff para agente (VS Code)

> Pégale esto a tu agente en VS Code para construir la landing. Es una **página de marketing oscura** (NO la app — la app es light/dark, esto es solo dark). Recréala con tus componentes; usa el prototipo `Despachr Landing.dc.html` como fuente de medidas, copy e interacciones. No copies el HTML literal.

## Stack sugerido
- Next.js (App Router) + Tailwind + shadcn/ui + **lucide-react** para iconos.
- Fuentes: **Inter** (UI) + **JetBrains Mono** (cifras, placas, montos, URLs).
- Animaciones: CSS keyframes + un `IntersectionObserver` para scroll-reveal y count-up (no requiere librería; si prefieres, Framer Motion).

---

## Paleta (tema OSCURO fijo, sin toggle)
| Token | Valor | Uso |
|---|---|---|
| Fondo base | `#0A0C0B` | Fondo general de la página |
| Superficie | `#141414` / `#18181B` | Cards, mockup chrome |
| Superficie 2 | `#1C1C1F` | Inputs/barras internas |
| Borde | `rgba(255,255,255,.08–.12)` | Bordes sutiles sobre oscuro |
| Texto | `#FAFAFA` | Titulares, texto fuerte |
| Texto 2 | `#A1A1AA` | Párrafos, subtítulos |
| Faint | `#71717A` | Labels pequeños, captions |
| **Primario** | `#0F6E56` | Botones, acentos |
| **Primario 2** | `#1D9E75` | Hovers, "en vivo", barras |
| Éxito | `#DCFCE7` bg / `#15803D` text | Badges de estado |
| Error | `#FEF2F2` bg / `#DC2626` text | Badge "Retrasada" |

> El **mini dashboard del demo va en LIGHT (Zinc)** dentro del marco oscuro — ver sección Demo. Es el contraste intencional "marketing oscuro → producto claro".

---

## Estructura (3 secciones + nav + footer)

### Nav (sticky, blur)
- Logo (cuadro verde `#0F6E56` + icono camión lucide `truck`) + wordmark "Despachr".
- Links: Producto · Cómo funciona · Plataforma · Precios.
- Acciones: "Iniciar sesión" (ghost) + **"Acceder"** (botón verde con flecha `arrow-right`).

### 1. Hero (2 columnas)
**Izquierda:**
- Badge pill: punto verde con **ping animado** + "Plataforma logística en tiempo real".
- H1 (~60px, weight 800, tracking -2px): "Toda tu operación de carga, **en tiempo real.**" (las últimas 2 palabras en verde `#0F6E56`).
- Párrafo (~19px, `#A1A1AA`): "Conductores, rutas y cumplimiento sincronizados — desde el primer despacho hasta la última entrega. Sin llamadas, sin hojas de cálculo."
- CTAs: **"Acceder ahora"** (verde, flecha) + "Ver demo" (outline, icono play).
- Prueba social: stack de 3 avatares (CM, AG, +9) + "Empresas de transporte de carga ya operan con Despachr en Colombia."
- **Entrada escalonada**: cada elemento con `fadeUp` y `animation-delay` creciente (.08s, .16s, .24s, .32s).

**Derecha — visualización "EN VIVO" (la pieza estrella):**
> 📍 **Guía detallada aparte: `LANDING-mapa-en-vivo.md`** — el detalle de las 3 capas (mapa real + ruta vial + camión con `offset-path`). Léela si esta pieza no te quedó como el diseño. Resumen abajo.
- Card (520×440) que **flota** suavemente (`float` 6s infinite), borde sutil, sombra grande.
- **Mapa real**: tiles oscuros de **CARTO dark_all** (OpenStreetMap) centrados en la Costa Atlántica (Barranquilla). En el prototipo se montan 9 tiles z=11 alrededor de `597,960`. Para producción usa un mapa con tu token (Mapbox/MapTiler dark, centro ≈ `lat 10.96, lon -74.85`, zoom ~11). Mantén la **atribución** "© OpenStreetMap · CARTO".
- **Ruta real por calles**: trazado vial Puerto Colombia → Barranquilla → Soledad (geometría obtenida de un servicio de routing tipo OSRM/Mapbox Directions). Dibújala como `path` SVG encima del mapa: una línea base gris + línea verde punteada con **dash animado** (marcha de hormigas).
- **Camión** (marcador verde con icono `truck`) que recorre el path con `offset-path: path(...)` + `offset-rotate`, animación ~7s en bucle. Un **glow dot** verde lo precede.
- **Pines**: origen (gris), parada intermedia (ámbar con ping), destino (verde) — anclados sobre la ruta.
- **Chips flotantes**: badge "EN VIVO · 4 rutas" (arriba izq, punto que pulsa), chip "Carlos M. · ABC-123" sobre el mapa, y un **toast** "Entrega confirmada · Makro Montería · cumplido + firma · 11:32" que aparece/desaparece en bucle (`toast` keyframe).

### Sección de stats (banda con count-up)
4 cifras que **animan de 0 al valor** al entrar en viewport (ease-out cubic, ~1.5s), en JetBrains Mono:
- **94.8%** Cumplimiento de entrega
- **48.3 T** Movilizadas por semana
- **+1.200** Rutas completadas / mes
- **23.6%** Margen promedio

### 2. Demo / "La plataforma" (mockup en LIGHT)
Marco de navegador (barra oscura con 3 dots + URL `app.despachr.co/operacion` en mono) que contiene el dashboard en **tema light Zinc**:
- **Sidebar claro** (`#FAFAFA`, borde `#E4E4E7`): logo + items "Operación en vivo" (activo, fondo `#F0F0F1`), Rutas, Conductores, Clientes, Métricas.
- Header: "Operación en vivo · Lunes 15 de enero · actualizado hace 12 s".
- **4 KPI cards** con micro-deltas:
  - En ruta **12** (▲ 8 hoy) — número en verde
  - Completadas **84** (92% del plan)
  - Paradas hoy **142** (38 t movilizadas)
  - Retrasadas **2** (SLA 98.6%) — card roja (`#FEF2F2`/`#FECACA`)
- **Gráfica de barras** "Toneladas movilizadas por día" (L–V): baseline inferior, barras verdes finas con el **pico resaltado** y el resto a ~0.5 de opacidad; valores en mono encima; anim `bar` (scaleY).
- **Donut** "Cumplimiento global": `conic-gradient(#1D9E75 0 94.8%, #E4E4E7 ...)`, centro blanco con 94.8% / "a tiempo".
- **Tabla "Rutas activas"** (6 en operación): columnas Ruta · Conductor · Progreso (barra + n/total) · ETA · Estado (badge). Filas:
  - Costa Atlántica · Carlos Martínez · 1/3 · 15:30 · **En ruta** (verde)
  - Sabana Centro · Andrés Gómez · 4/6 · 16:10 · **En ruta** (verde)
  - Valle del Cauca · María Restrepo · 2/5 · 17:45 · **Retrasada** (rojo, barra roja)
- Todo el bloque entra con `fadeUp` + leve `scale` al hacer scroll.

### 3. CTA de cierre
Panel oscuro (`#0A0A0A`) con glow verde radial:
- H2 (~42px, 800): "Empieza a operar en tiempo real".
- Subtítulo: "Digitaliza tu operación de carga hoy. Sin instalaciones, sin contratos largos."
- Botones: **"Empezar ahora"** (verde, flecha) + "Hablar con ventas" (ghost claro).

### Footer
Logo + links (Producto/Precios/Soporte/Privacidad) + "© 2026 Despachr · Transporte de carga".

---

## Animaciones (resumen de keyframes)
- `fadeUp` — opacity 0→1 + translateY(26px→0), cubic-bezier(.22,1,.36,1). Para hero (con delays) y scroll-reveal.
- `float` — translateY ±12px, 6s ease-in-out infinite. Card del mapa.
- `ping` — scale(1→2.6) + fade out. Puntos "en vivo".
- `pulse` — opacity 1↔.35. Badge EN VIVO.
- `dash` — `stroke-dashoffset` para la marcha de hormigas en la ruta.
- `truck` / `flow` — `offset-distance: 0%→100%` sobre el `offset-path` de la ruta.
- `toast` — entrada/salida cíclica del aviso de entrega.
- `bar` — `scaleY(0→1)` para barras del gráfico.
- **count-up** en JS con `IntersectionObserver` (dispara al 60% visible) + `requestAnimationFrame`, formato `es-CO`.

## Reglas
- **Sin toggle de tema** en la landing (queda oscura). El switch light/dark es solo para la app.
- Mantén el copy y los datos de ejemplo (son coherentes con el resto del producto).
- Respeta accesibilidad: contraste AA, y `prefers-reduced-motion` para desactivar las animaciones de bucle.
- Mapa en producción: usa proveedor con API key propia y conserva atribución OSM.

## Referencia
Prototipo de alta fidelidad: `Despachr Landing.dc.html`. Tokens de la app y gráficas: `UPDATE-tema-y-graficas.md`.
