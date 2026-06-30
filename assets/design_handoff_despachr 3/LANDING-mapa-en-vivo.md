# Landing · Visualización "EN VIVO" del mapa — guía de implementación

> **Por qué tu versión no quedó igual:** tu build dibujó la ruta como una curva decorativa sobre una **cuadrícula CSS**, sin el **mapa real** debajo ni el trazado por calles. El efecto que buscamos = **3 capas apiladas**: (1) imagen de **mapa real** de Barranquilla, (2) la **ruta vial real** dibujada en SVG encima, (3) el **camión + pines + chips** animados sobre todo. Abajo está exactamente cómo se hace, con dos rutas de implementación: la "rápida" (tiles estáticos, como el prototipo) y la "correcta para producción" (librería de mapas).

Referencia visual: `screenshots/landing-01-hero.png` (así se debe ver).

---

## El contenedor
Card de **520×440** (en el prototipo), `position:relative`, `overflow:hidden`, `border-radius:18px`, fondo base `#0d0f0e`. Todo lo de abajo vive **dentro** de esta card, en capas absolutas.

```
┌─ card 520×440 (relative, overflow:hidden) ──────────┐
│  capa 1: <img> tiles del mapa  (z:0)                 │
│  capa 2: overlay oscuro + glow (z:1) — legibilidad   │
│  capa 3: <svg> ruta vial (z:2)                       │
│  capa 4: dot glow + camión (offset-path) (z:3)       │
│  capa 5: pines, chips, badge EN VIVO, toast (z:4)    │
└──────────────────────────────────────────────────────┘
```

---

## OPCIÓN A — Producción (recomendada): librería de mapas
Usa **MapLibre GL JS** (open source, sin costo) o **Mapbox GL JS** con tu token. Es lo correcto porque el mapa queda nítido, responsive y la ruta se alinea sola con las coordenadas reales.

1. **Mapa base oscuro** centrado en Barranquilla:
   - centro `≈ [lng -74.83, lat 10.97]`, zoom `≈ 11`, **sin interacción** (`interactive:false`) para que sea decorativo.
   - estilo dark: MapTiler "Dark", Mapbox "dark-v11", o el estilo CARTO `dark-matter`.
2. **Ruta vial real**: pide la geometría a un servicio de routing y píntala como capa `line`:
   - **OSRM** (demo gratis) o **Mapbox Directions**. Ejemplo OSRM:
     `https://router.project-osrm.org/route/v1/driving/-74.953,10.998;-74.7647,10.917?overview=full&geometries=geojson`
     (origen Puerto Colombia → destino Soledad). Devuelve un GeoJSON `LineString`.
   - Añádelo como `source` GeoJSON y dos capas `line`: una base gris translúcida y encima la verde `#1D9E75` punteada (`line-dasharray`). Anima el dash para el efecto "marcha de hormigas".
3. **Camión animado**: marcador HTML (círculo verde con icono `truck`) cuya posición se interpola a lo largo de la geometría con `turf.along(line, distancia)` en un `requestAnimationFrame` (recorre 0→largo total en ~7s y reinicia).
4. **Pines**: `Marker` en origen (gris), parada intermedia (ámbar con ping), destino (verde).
5. **Chips/toast**: HTML normal posicionado `absolute` sobre el contenedor del mapa (no son del mapa).

> Esta opción es la que debe quedar en el sitio final. El truco de "tiles estáticos" de abajo es solo si quieres replicar el prototipo 1:1 sin dependencias.

---

## OPCIÓN B — Rápida: tiles estáticos (lo que hace el prototipo)
No usa librería; monta a mano 9 imágenes de tiles dark de CARTO y dibuja la ruta con coordenadas ya calculadas. Útil para clonar el look exacto.

### Capa 1 — tiles del mapa
Grid 3×3 de tiles z=11 de CARTO **dark_all**, desplazado para centrar Barranquilla. Patrón de URL: `https://{a|b|c|d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`.

```html
<div style="position:absolute;inset:0;background:#0d0f0e;overflow:hidden;">
  <div style="position:absolute;left:-124px;top:-164px;width:768px;height:768px;
              display:grid;grid-template-columns:repeat(3,256px);grid-template-rows:repeat(3,256px);
              filter:saturate(.85) contrast(1.02);">
    <img src="https://a.basemaps.cartocdn.com/dark_all/11/597/960.png" width="256" height="256" alt="">
    <img src="https://b.basemaps.cartocdn.com/dark_all/11/598/960.png" width="256" height="256" alt="">
    <img src="https://c.basemaps.cartocdn.com/dark_all/11/599/960.png" width="256" height="256" alt="">
    <img src="https://d.basemaps.cartocdn.com/dark_all/11/597/961.png" width="256" height="256" alt="">
    <img src="https://a.basemaps.cartocdn.com/dark_all/11/598/961.png" width="256" height="256" alt="">
    <img src="https://b.basemaps.cartocdn.com/dark_all/11/599/961.png" width="256" height="256" alt="">
    <img src="https://c.basemaps.cartocdn.com/dark_all/11/597/962.png" width="256" height="256" alt="">
    <img src="https://d.basemaps.cartocdn.com/dark_all/11/598/962.png" width="256" height="256" alt="">
    <img src="https://a.basemaps.cartocdn.com/dark_all/11/599/962.png" width="256" height="256" alt="">
  </div>
</div>
```
Tiles z=11 usados: x ∈ {597,598,599}, y ∈ {960,961,962}. El `left:-124 / top:-164` reencuadra para que Barranquilla quede centrada en la card de 520×440.

### Capa 2 — overlay de legibilidad
```html
<div style="position:absolute;inset:0;
  background:linear-gradient(rgba(10,12,11,.35),rgba(10,12,11,.5)),
             radial-gradient(circle at 72% 28%,rgba(29,158,117,.16),transparent 58%);"></div>
<div style="position:absolute;right:8px;bottom:6px;font-size:9px;color:rgba(255,255,255,.4);
  font-family:'JetBrains Mono',monospace;z-index:2;">© OpenStreetMap · CARTO</div>
```

### Capa 3 — ruta vial (SVG, coordenadas ya proyectadas)
La geometría OSRM (Puerto Colombia → Barranquilla → Soledad) fue convertida a coordenadas de la card 520×440. Dos paths iguales: base gris + verde con dash animado.
```html
<svg style="position:absolute;inset:0;" width="520" height="440" viewBox="0 0 520 440">
  <!-- d = trazado real proyectado -->
  <path d="M29.8 103.7 L31.6 108.3 L40.4 112.5 L42.6 112.7 L60.1 102 L88.8 86.9 L125 81.6 L163.2 76.8 L184.5 78.6 L213.4 94 L221.8 97.5 L234.9 103.9 L242.9 107.6 L247.6 111.1 L259.9 115.4 L274.3 119.6 L284.1 121.8 L288.4 127.9 L278.6 150.2 L272.7 165.7 L274.2 177.9 L277.5 189.5 L280.4 197.2 L286.1 215.7 L295.4 223.2 L304 223.8"
        fill="none" stroke="rgba(148,163,184,.45)" stroke-width="4" stroke-linecap="round"/>
  <path d="…mismo d…" fill="none" stroke="#1D9E75" stroke-width="2.5"
        stroke-dasharray="1 8" stroke-linecap="round" style="animation:dz-dash 1s linear infinite"/>
</svg>
```
`@keyframes dz-dash { to { stroke-dashoffset:-28 } }`

### Capa 4 — camión sobre la ruta (CSS `offset-path`)
El marcador recorre **exactamente el mismo `d`** del path con `offset-path:path('…')` + `offset-distance` animado de 0→100%.
```html
<div style="position:absolute;top:0;left:0;
     offset-path:path('M29.8 103.7 … L304 223.8'); offset-rotate:0deg;
     animation:dz-truck 7s ease-in-out infinite;">
  <div style="transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;
       background:#0F6E56;border:3px solid #121212;box-shadow:0 6px 16px rgba(15,110,86,.6);
       display:flex;align-items:center;justify-content:center;">
    <!-- icono lucide truck, blanco -->
  </div>
</div>
```
`@keyframes dz-truck { 0%{offset-distance:0%;opacity:0} 6%{opacity:1} 92%{opacity:1} 100%{offset-distance:100%;opacity:0} }`
(Opcional: un segundo punto con glow usando la misma técnica para reforzar el "barrido".)

### Capa 5 — pines, chips y toast (HTML absoluto)
Coordenadas sobre la card (mismo sistema que el path):
- **Origen** (gris) en `left:29.8 top:103.7`; **parada** (ámbar + ping) en `left:213.4 top:94`; **destino** (verde) en `left:304 top:223.8`.
- Badge **"EN VIVO · 4 rutas"** arriba-izq (punto verde que pulsa).
- Chip **"Carlos M. · ABC-123"** flotando cerca del camión.
- **Toast** "Entrega confirmada · Makro Montería · cumplido + firma · 11:32" abajo, que entra/sale en bucle (`dz-toast`).
- La card entera flota: `animation:dz-float 6s ease-in-out infinite`.

---

## Errores a evitar (lo que pasó en tu build)
- ❌ Dibujar una **curva suave** inventada → debe ser el **trazado vial** (polilínea con muchos vértices) que sigue calles.
- ❌ Fondo de **cuadrícula CSS** en vez de imagen de mapa → falta la capa 1 (tiles o librería de mapas).
- ❌ Camión animado por `top/left` o `translateX` → usa **`offset-path` con el mismo path** de la ruta para que vaya pegado a la vía.
- ❌ Olvidar la **atribución** "© OpenStreetMap · CARTO/Mapbox" (es obligatoria).
- ⚠️ En producción, **no** uses el CDN público de CARTO/OSRM para tráfico real: registra tu propia API key (MapTiler/Mapbox) y, si quieres, cachea la geometría de la ruta.
- ♿ Respeta `prefers-reduced-motion`: si está activo, deja el camión quieto a mitad de ruta.

## Resumen de keyframes que usa esta pieza
`dz-dash` (marcha de hormigas) · `dz-truck`/`dz-flow` (offset-distance 0→100%) · `dz-ping` (pines en vivo) · `dz-pulse` (badge) · `dz-toast` (aviso) · `dz-float` (card).
