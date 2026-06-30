# Landing · tarjeta de mapa "EN VIVO" — guía de implementación

La pieza estrella del hero. **Recomendación para tu build: usa Mapbox GL JS** (lo mencionaste) — abajo está la receta Mapbox completa. El prototipo la simula con tiles estáticos; se documenta también por si quieres clonar el look 1:1.

Referencia visual: `screenshots/landing-01-hero.png`.

---

## Anatomía (3 capas + adornos)
Tarjeta **520×440**, `position:relative`, `overflow:hidden`, `border-radius:18px`. Lo importante para el contraste sobre el hero negro está en el **marco**:

```
card  (relative, overflow:hidden, border-radius:18px)
  background:#15181d
  border:1px solid rgba(255,255,255,.22)
  box-shadow:
    0 50px 100px -30px rgba(0,0,0,.7),      ← elevación
    0 0 0 1px rgba(255,255,255,.05),         ← hairline
    0 0 60px -10px rgba(29,158,117,.45);     ← HALO VERDE (despega del negro)
  animation: dz-float 6s ease-in-out infinite;
```
> **Clave del último ajuste:** el mapa es oscuro pero **no negro puro** y la tarjeta lleva halo verde, para que no sea "negro sobre negro" con el hero `#0A0A0A`.

Capas, de abajo a arriba:
1. **Mapa** (tiles o Mapbox) — oscuro, ligeramente levantado en brillo.
2. **Overlay** — vignette sutil + glow verde para legibilidad.
3. **Ruta** (SVG o capa Mapbox) — casing claro + línea verde punteada animada.
4. **Adornos** — punto-glow + camión sobre la ruta, 3 pines, pill "EN VIVO", chip de conductor, toast de entrega.

---

## ✅ OPCIÓN A — Mapbox GL JS (para producción)

1. **Mapa base oscuro, no interactivo** (decorativo):
   ```js
   const map = new mapboxgl.Map({
     container: el,
     style: 'mapbox://styles/mapbox/dark-v11',   // dark base
     center: [-74.83, 10.97],                     // Barranquilla
     zoom: 11.4,
     interactive: false,
     attributionControl: true
   });
   ```
   Para acercarlo al gris-oscuro del diseño (no negro), o subduir el azul, puedes clonar el estilo en Mapbox Studio y subir la luminosidad del `land`/`water`, **o** dejar un overlay como en el prototipo. Mantén el **marco con halo verde** de la tarjeta (eso da el contraste, no el estilo del mapa).

2. **Ruta vial real** — pídela a Mapbox Directions y píntala como dos capas `line` (casing + línea):
   ```js
   // GET https://api.mapbox.com/directions/v5/mapbox/driving/
   //   -74.953,10.998;-74.7647,10.917?geometries=geojson&overview=full&access_token=...
   map.addSource('route', { type:'geojson', data: geojsonLineString });
   map.addLayer({ id:'route-casing', type:'line', source:'route',
     paint:{ 'line-color':'#ffffff', 'line-width':7, 'line-opacity':.9 },
     layout:{ 'line-cap':'round','line-join':'round' } });
   map.addLayer({ id:'route-line', type:'line', source:'route',
     paint:{ 'line-color':'#1D9E75', 'line-width':3.5, 'line-dasharray':[0.4,1.8] },
     layout:{ 'line-cap':'round','line-join':'round' } });
   ```
   El **casing blanco bajo la línea verde** es el look "trazado Apple/Mapbox".

3. **Camión que avanza** — marcador HTML interpolado con turf:
   ```js
   import along from '@turf/along'; import length from '@turf/length';
   const total = length(route); // km
   function frame(t){
     const d = (t % DURATION)/DURATION * total;
     const p = along(route, d).geometry.coordinates;
     truckMarker.setLngLat(p);
     requestAnimationFrame(frame);
   }
   ```
   Marcador = círculo verde `#0F6E56` con icono `truck` blanco, borde oscuro, sombra.

4. **Pines** (`mapboxgl.Marker` HTML): origen (gris), parada intermedia (ámbar con `ping`), destino (verde con glow). Coordenadas: Puerto Colombia, centro Barranquilla, Soledad.

5. **Adornos HTML** (no son del mapa, van `position:absolute` sobre el contenedor):
   - Pill **"EN VIVO · 4 rutas"** — glassy: `background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18); color:#fff`. Punto verde con `pulse`.
   - Chip **"Carlos M. · ABC-123"** — `#1E1E1E`, punto ámbar.
   - **Toast "Entrega confirmada · Makro Montería · cumplido + firma · 11:32"** — abajo, `#1A1A1A`, check verde; entra/sale en loop (`dz-toast`).
   - La tarjeta entera flota (`dz-float`).

Atribución: mantener "© Mapbox © OpenStreetMap" (obligatoria). Usa tu propio `access_token` y, si quieres, cachea la geometría de la ruta.

---

## OPCIÓN B — réplica exacta del prototipo (tiles estáticos, sin SDK)

El prototipo no usa SDK: monta tiles raster y dibuja la ruta en SVG con coordenadas ya proyectadas. Útil para clonar el look sin dependencias.

### Capa 1 — tiles oscuros con "supersampling"
Para que se vean **más calles**, se usan tiles de **zoom 12** (más detalle) dibujados a **mitad de tamaño (128px)** sobre la huella de zoom 11 → grilla **6×6** dentro de un contenedor 768×768 desplazado `left:-124 top:-164`. Tiles: CARTO **dark_all**, `z=12`, `x∈[1194..1199]`, `y∈[1920..1925]`.
```html
<div style="position:absolute;inset:0;background:#15181d;overflow:hidden;">
  <div style="position:absolute;left:-124px;top:-164px;width:768px;height:768px;
              display:grid;grid-template-columns:repeat(6,128px);grid-template-rows:repeat(6,128px);
              filter:saturate(.95) brightness(1.15) contrast(1.06);">   <!-- brightness>1 = sube el negro a gris-oscuro -->
    <!-- 36 <img> de https://{a|b|c|d}.basemaps.cartocdn.com/dark_all/12/{x}/{y}.png a 128×128 -->
  </div>
</div>
```
> El `filter: brightness(1.15)` es lo que evita el "negro sobre negro": levanta el mapa a gris-oscuro. Súbelo/bájalo para calibrar contraste.

### Capa 2 — overlay
```html
<div style="position:absolute;inset:0;
  background:linear-gradient(rgba(8,10,9,.12),rgba(8,10,9,.34)),
             radial-gradient(circle at 72% 28%,rgba(29,158,117,.16),transparent 56%);"></div>
<div style="position:absolute;right:8px;bottom:6px;font-size:9px;color:rgba(255,255,255,.45);
  font-family:'JetBrains Mono',monospace;">© OpenStreetMap · CARTO</div>
```

### Capa 3 — ruta (SVG, coordenadas ya proyectadas a la tarjeta 520×440)
Dos paths con el mismo `d` (casing claro + verde punteado animado). `d` real (Puerto Colombia → Barranquilla → Soledad):
```
M29.8 103.7 L31.6 108.3 L40.4 112.5 L42.6 112.7 L60.1 102 L88.8 86.9 L125 81.6 L163.2 76.8
L184.5 78.6 L213.4 94 L221.8 97.5 L234.9 103.9 L242.9 107.6 L247.6 111.1 L259.9 115.4
L274.3 119.6 L284.1 121.8 L288.4 127.9 L278.6 150.2 L272.7 165.7 L274.2 177.9 L277.5 189.5
L280.4 197.2 L286.1 215.7 L295.4 223.2 L304 223.8
```
```html
<path d="…" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="10" stroke-linecap="round"/>
<path d="…" fill="none" stroke="#1D9E75" stroke-width="3.5" stroke-linecap="round"
      stroke-dasharray="2 10" style="animation:dz-dash 1s linear infinite"/>
```

### Capa 4 — camión + glow sobre la ruta (CSS `offset-path`)
El marcador recorre el **mismo `d`** con `offset-path:path('…')` y `offset-distance` animado 0→100%:
```css
@keyframes dz-truck { 0%{offset-distance:0%;opacity:0} 6%{opacity:1} 92%{opacity:1} 100%{offset-distance:100%;opacity:0} }
@keyframes dz-flow  { 0%{offset-distance:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{offset-distance:100%;opacity:0} }
@keyframes dz-dash  { to{ stroke-dashoffset:-28 } }
```

### Pines (coordenadas sobre la tarjeta)
Origen (gris) `29.8,103.7` · parada (ámbar + `ping`) `213.4,94` · destino (verde + glow) `304,223.8`.

---

## Errores a evitar
- ❌ Curva inventada en vez del **trazado vial real** (polilínea que sigue calles).
- ❌ Cuadrícula CSS en vez de mapa real (Mapbox o tiles).
- ❌ Camión animado por `top/left` → usa `offset-path` con el mismo path (o `turf.along` en Mapbox).
- ❌ **Mapa negro sobre hero negro** → sube el brillo del mapa (gris-oscuro) y deja el **halo verde** en el marco de la tarjeta.
- ❌ Olvidar la atribución (Mapbox/OSM/CARTO, obligatoria).
- ⚠️ En producción usa tu propio token/servicio; no dependas de CDNs públicos para tráfico real.

## Keyframes usados
`dz-dash` · `dz-truck` / `dz-flow` (offset-distance) · `dz-ping` (pines/origen-destino) · `dz-pulse` (pill EN VIVO) · `dz-toast` (aviso) · `dz-float` (tarjeta).
