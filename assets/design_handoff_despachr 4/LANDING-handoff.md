# Landing page — Despachr (handoff)

Especificación de `Despachr Landing.dc.html`. Es una **referencia de diseño en HTML**, no código de producción: recréala en tu stack (Next.js/React + Tailwind o lo que uses) leyendo el `.dc.html` como fuente de medidas y copy exactos. Para la pieza del mapa hay un doc aparte: **`LANDING-mapa-en-vivo.md`**.

Referencia visual: `screenshots/landing-01-hero.png`.

---

## Concepto
Landing de marketing **oscura** con **sección intercalada claro/oscuro** para dar ritmo y contraste (no todo negro). Estética premium tipo Linear/Stripe dark. Acento verde de marca.

### Ritmo de fondos (clave del diseño)
De arriba a abajo, alternando:
1. **Nav** — oscuro translúcido (sticky, blur)
2. **Hero** — oscuro `#0A0A0A` + tarjeta de mapa "EN VIVO"
3. **Producto** — **blanco `#FFFFFF`**
4. **Cómo funciona** — oscuro `#0A0A0A`
5. **Plataforma / demo** — **gris claro `#F8FAFC`**
6. **Precios** — oscuro `#0A0A0A`
7. **CTA** — verde (gradiente `#0F6E56→#0A3D2E`)
8. **Footer** — oscuro

> Cada sección clara es **full-bleed** (el `background` va en el `<section>`, con un `<div max-width:1200px>` interior). Las oscuras son transparentes sobre el body negro.

---

## Design tokens (landing)
**Fondo oscuro:** `#0A0A0A` · superficies dark `#101010` / `#121212` / `#15181d`
**Fondo claro:** `#FFFFFF` (Producto) · `#F8FAFC` (demo)
**Texto sobre oscuro:** `#FFFFFF` (títulos) · `#94A3B8` (cuerpo) · `#CBD5E1` (listas)
**Texto sobre claro:** `#0F172A` / `#18181B` (títulos) · `#64748B` (cuerpo)
**Acento:** `#0F6E56` (primario) · `#1D9E75` (hover/acento/destino)
**Borde claro:** `#E2E8F0` · **Borde oscuro:** `rgba(255,255,255,.08–.12)`
**Tipografía:** Inter (400–800) para todo; **JetBrains Mono** para cifras (precios, 11:32, métricas).
**Eyebrow** (cada sección): 13px / 600 / uppercase / letter-spacing .6px / color `#1D9E75`.
**H2 de sección:** 40px / 800 / tracking -1.2px.
**Radios:** secciones/cards 14–16px; pills 20–30px; mapa 18px.

---

## Logo (Ruta-D)
El nav y el footer usan el isotipo **Ruta-D** (ver paquete `brand/`): cuadro negro `#0A0A0A` redondeado con borde sutil, dentro la "D" formada por asta blanca + bowl punteado verde `#1D9E75` + nodo de destino verde. Junto al wordmark "Despachr" en blanco. (En el `.dc.html` está inline como SVG 40×48 escalado.)

---

## Sección por sección

### Nav (sticky)
`position:sticky;top:0`, `background:rgba(10,10,10,.72)` + `backdrop-filter:blur(12px)`, borde inferior `rgba(255,255,255,.08)`, alto 64px, max-width 1200.
- Izq: logo Ruta-D + "Despachr".
- Centro: tabs → **Producto** `#producto` · **Cómo funciona** `#como-funciona` · **Plataforma** `#preview` · **Precios** `#precios`. Color `#94A3B8`, hover `#fff`.
- Der: "Iniciar sesión" (ghost) + "Acceder →" (primario verde, hover `#1D9E75`).
- Todas las secciones objetivo llevan `scroll-margin-top:72px` para que el ancla no quede bajo el nav.

### Hero
Grid 2 columnas `1fr 1fr`, padding `84px 24px 104px`. Glows radiales verdes decorativos de fondo.
- **Izquierda:**
  - Pill "Plataforma logística en tiempo real" (fondo translúcido, punto verde con `ping`).
  - H1 **60px / 800 / tracking -2px**: "Toda tu operación de carga, **en tiempo real.**" (las últimas 3 palabras en `#1D9E75`).
  - Subhead 19px `#94A3B8`, máx 480px.
  - CTAs: **"Acceder ahora →"** (primario, sombra verde) + **"Ver demo"** (secundario translúcido, icono play) → ancla `#preview`.
  - Fila de avatares (CM, AG, +9) + "Empresas de transporte de carga ya operan con Despachr en Colombia."
  - Cada bloque entra con `dz-up` escalonado (delays .08/.16/.24/.32s).
- **Derecha:** tarjeta de mapa "EN VIVO" → **ver `LANDING-mapa-en-vivo.md`**. Flota con `dz-float`.

### Producto (blanco)
`background:#FFFFFF`. Eyebrow "Una sola plataforma" + H2 "Del celular del conductor al margen por cliente" + subhead.
Grid 2×2 de **4 cards** (blancas, borde `#E2E8F0`, radius 14px, sombra `0 1px 2px rgba(15,23,42,.04)`, hover: borde verde + sombra elevada). Cada card: chip de icono 46px `#DCFCE7` con icono lucide verde + título 19px/700 + texto `#64748B`.
1. **App del conductor** (icono `smartphone`)
2. **Coordinación en vivo** (icono `map-pin`)
3. **Métricas y márgenes** (icono `bar-chart`)
4. **Cumplido digital** (icono `shield-check`)
Entran con `data-reveal` escalonado.

### Cómo funciona (oscuro)
Eyebrow + H2 "Operativo en tres pasos". 3 columnas, cada una con chip numerado 56px (01 translúcido, **02 verde** resaltado con sombra, 03 verde-tinte) + título + texto.
1. Planea la ruta · 2. El conductor entrega · 3. Mides el resultado.

### Plataforma / demo (gris claro)
`background:#F8FAFC`. Eyebrow "La plataforma" + H2 "Coordina toda tu flota desde un tablero".
**Mockup de navegador** (borde `#E2E8F0`, sombra suave `0 40px 90px -35px rgba(15,23,42,.3)`):
- Barra de chrome oscura `#0A0A0A` (3 dots + URL `app.despachr.co/operacion`).
- App en claro: sidebar claro `#FAFAFA` (Operación en vivo activo, Rutas, Conductores, Clientes, Métricas) + contenido: 4 mini-KPIs (En ruta 12, Completadas 84, Paradas 142, Retrasadas 2), gráfica de barras "Toneladas por día" (animación `dz-bar`), anillo "94.8% a tiempo" (conic-gradient), tabla "Rutas activas" (3 filas con badges). Es el mismo lenguaje visual del dashboard del admin (ver README de la app).
Entra con `data-reveal` (fade + scale).

### Precios (oscuro)
Eyebrow "Precios" + H2 "Un plan para cada tamaño de flota" + subhead. Toggle decorativo "Facturación mensual / Anual · 2 meses gratis".
**3 planes** (grid 3 col):
| Plan | Precio (mock) | Límite | CTA |
|---|---|---|---|
| **Arranque** | `$290k` COP/mes | Hasta 5 conductores | "Empezar" (outline) |
| **Operación** ⭐ *Más popular* | `$690k` COP/mes | Hasta 20 conductores | "Acceder ahora" (primario) |
| **Flota** | `A medida` | Conductores ilimitados | "Hablar con ventas" (outline) |
La card "Operación" va resaltada: fondo verde oscuro `linear-gradient(#11201A,#0d1512)`, borde verde, badge "MÁS POPULAR", sombra verde. Cada plan lista features con check verde (lucide `check`). Precios en **JetBrains Mono**. Nota al pie: "Precios de referencia en COP, sin IVA…".
> ⚠️ Los valores son **mock** — reemplázalos cuando se definan los reales.

### CTA
Card centrada, gradiente verde `135deg #0F6E56→#0A3D2E`, radius 24px, glows decorativos. H2 42px/800 blanco "Empieza a operar en tiempo real" + subhead + botones "Empezar ahora" (blanco) / "Hablar con ventas" (translúcido).

### Footer (oscuro)
Logo Ruta-D + "Despachr" · links (Producto `#producto`, Precios `#precios`, Soporte, Privacidad) · "© 2026 Despachr · Transporte de carga".

---

## Animaciones
- **`dz-up`** — entrada del hero, opacity+translateY, escalonada por delay.
- **`data-reveal`** — scroll reveal de secciones/cards. En el prototipo lo maneja un `IntersectionObserver` (threshold .14) que al entrar pone `opacity:1; transform:none` y aplica un `transition-delay` opcional desde `data-delay`. En React: replícalo con un hook `useInView` (p.ej. `framer-motion` `whileInView` o IntersectionObserver propio) — los elementos arrancan en `opacity:0; translateY(20–24px)`.
- **`dz-float`** (tarjeta de mapa), **`dz-bar`** (barras del demo), y las del mapa (`dz-dash`, `dz-flow`, `dz-truck`, `dz-toast`, `dz-ping`, `dz-pulse`) → ver doc del mapa.
- Respeta `prefers-reduced-motion`: desactiva loops y deja el estado final.

## Iconos
lucide-react: `truck`, `map-pin`, `bar-chart-3`, `smartphone`, `shield-check`, `check`, `arrow-right`, `play-circle`, `camera`, `phone`, `navigation`, `bell`, `search`.

## Responsivo
El prototipo es desktop (1200px). Para móvil: hero pasa a 1 columna (mapa debajo del texto), Producto a 1 columna, Precios a columnas apiladas (Operación primero o resaltada), nav colapsa a menú. Mantén el ritmo claro/oscuro.

## Archivos
- `Despachr Landing.dc.html` — prototipo (fuente de medidas/copy).
- `LANDING-mapa-en-vivo.md` — la tarjeta de mapa "EN VIVO" (capas, animaciones, **migración a Mapbox**).
- `screenshots/landing-01-hero.png` — referencia visual del hero.
