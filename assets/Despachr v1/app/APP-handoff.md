# Handoff: Despachr — App (producto)

> Parte del paquete **Despachr v1**. Para el índice general, la landing y la marca, ver el `README.md` de la carpeta raíz. Este documento cubre **la app**.

## 📂 Documentos de la app

| Documento | Qué cubre |
|---|---|
| **Este `APP-handoff.md`** | La app completa (login, conductor, coordinador, admin) + design tokens + todas las pantallas, estado e interacciones. |
| `UPDATE-tema-y-graficas.md` | **Tema light/dark (escala Zinc)** + sidebar claro estilo Linear + gráficas pulidas. **Sustituye la paleta de la sección Design Tokens de abajo.** |

Archivo de referencia: `Despachr.dc.html` · capturas en `screenshots/`. (La landing tiene sus propios docs en `../landing/`.)

> ⚠️ **Orden de precedencia de la paleta**: la app objetivo usa el **tema Zinc light/dark** descrito en `UPDATE-tema-y-graficas.md`. La tabla de colores de este README documenta el prototipo original (sidebar negro, solo light) y queda **superada** por ese documento — úsalo como la fuente de verdad de color/tema. El resto de este README (estructura, pantallas, interacciones, estado) sigue plenamente vigente.

---

## Overview
Despachr digitaliza la operación de empresas de transporte de carga. Este paquete contiene un **prototipo de alta fidelidad** con cuatro experiencias y sus sub-páginas:

1. **Login** — acceso al panel de operación.
2. **App del conductor (móvil)** — lista de entregas → entrega activa con timer → captura de cumplido → confirmación.
3. **Dashboard del coordinador (web)** — Operación en vivo (mapa + alertas), Rutas, Conductores, Clientes.
4. **Dashboard del admin (web)** — Métricas/KPIs, Clientes, Facturación, Reportes.

## About the Design Files
El archivo `Despachr.dc.html` es una **referencia de diseño hecha en HTML** — un prototipo que muestra el aspecto y el comportamiento previstos, **no** código de producción para copiar tal cual. La tarea es **recrear estos diseños en el entorno del proyecto destino** (React, Vue, Next, etc.) usando sus patrones y librerías establecidas. Si el proyecto aún no tiene entorno, elige el framework más apropiado e impleméntalo ahí.

El estilo objetivo es **shadcn/ui + Radix** (componentes neutros, light mode con acentos oscuros, referencias Stripe/Linear). Si ya usas shadcn, mapea cada elemento a sus componentes (`Button`, `Card`, `Table`, `Badge`, `Input`, `Tabs`, `Avatar`, `Progress`, etc.). Los iconos son de **lucide-react**.

> Cómo abrir el prototipo: `Despachr.dc.html` es un Design Component y requiere su runtime para verse en navegador. Para implementar **no necesitas ejecutarlo** — toda la especificación está en este README, y puedes leer el HTML como fuente de medidas y copy exactos.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciado e interacciones son finales. Recrear pixel-perfect usando los componentes de tu codebase.

---

## Design Tokens

> 🎨 **Nota de tema**: los valores de abajo son los del **prototipo original** (sidebar negro `#0A0A0A`, modo claro único, fondo `#F8FAFC`). La app objetivo migró a la **escala Zinc con light/dark** — ver `UPDATE-tema-y-graficas.md` para los tokens vigentes (fondo light `#FAFAFA` / dark `#09090B`, sidebar claro estilo Linear, etc.). El acento verde de marca (`#0F6E56` / `#1D9E75`) **no cambia** entre versiones.

### Colores
| Token | Hex | Uso |
|---|---|---|
| Primario | `#0F6E56` | Botones, CTAs, estados activos |
| Primario hover | `#0A5A45` | Hover de botón primario |
| Secundario | `#1D9E75` | Hovers, badges de éxito, acentos |
| Acento | `#0A0A0A` | Sidebars, panel de login, headers fuertes |
| Sidebar item activo | `#1A1A1A` | Fondo del item de menú seleccionado |
| Sidebar hover | `#161616` | Hover de items de menú |
| Fondo | `#F8FAFC` | Fondo general de la app |
| Superficie | `#FFFFFF` | Cards, modales, topbar |
| Superficie sutil | `#FBFCFD` | Headers y hover de filas en tablas |
| Borde | `#E2E8F0` | Separadores, outlines |
| Borde sutil | `#F1F5F9` | Líneas entre filas, divisores internos |
| Texto | `#0F172A` | Texto primario |
| Texto medio | `#475569` | Texto secundario en tablas |
| Texto suave | `#64748B` | Labels, subtítulos |
| Texto muted | `#94A3B8` | Placeholders, texto sobre fondo oscuro |
| Error | `#DC2626` | Alertas críticas, vencido, retrasado |
| Warning | `#D97706` | Alertas moderadas, pendiente, programada |
| Success | `#1D9E75` / `#0F6E56` | Confirmaciones, on-time |

### Badges (fondo / texto)
- Verde (éxito/activo/pagada/en ruta): bg `#DCFCE7`, texto `#0F6E56`
- Gris (neutro/completada/pausado): bg `#F1F5F9`, texto `#64748B`
- Rojo (error/vencida/retrasada): bg `#FEF2F2`, texto `#DC2626`
- Amarillo (warning/pendiente/programada): bg `#FFFBEB`, texto `#D97706`

### Tipografía
- **Inter** (UI general). Fallback: system stack.
- **JetBrains Mono** (números, cifras, placas, horas, montos, IDs de factura).
- Heading XL: 32px / 700 / tracking -0.5px (no usado a tope; los headers de página son 24px)
- Heading página: 24px / 700 / tracking -0.5px
- Heading sección/card: 14px / 600
- Body: 14px / 400 / line-height 1.6
- Small/label: 12–13px / 400–500 / color `#64748B`
- Labels de tabla (uppercase): 11px / 600 / letter-spacing 0.4px / color `#64748B`
- KPI grandes: 30px / 600 mono (admin), 24–26px en cards de resumen

### Espaciado
Base 4px. Escala: 4, 8, 12, 16, 24, 32, 48, 64.

### Bordes y sombras
- Radius cards: 8–10px. Radius dashboard shell: 14px. Botones: 6–7px. Badges/pills: 20px. Inputs: 6px.
- Sombra card: `0 1px 2px rgba(15,23,42,.04)`
- Sombra shell/elevada: `0 20px 50px -24px rgba(15,23,42,.25)`
- Focus ring inputs: `0 0 0 3px rgba(15,110,86,.12)` + border `#0F6E56`
- Botón primario elevado (móvil): `0 8px 20px -6px rgba(15,110,86,.5)`

### Animaciones
- `fadeUp`: opacity 0→1 + translateY(10px→0), 0.35–0.4s ease — al montar cada pantalla/sub-página.
- `pop`: scale(.6→1.08→1) + opacity, 0.3–0.45s — check de confirmación, foto/firma capturadas.
- `ping`: scale(1→2.6) + opacity 0.5→0, 1.6–1.8s loop — punto "en vivo".
- `pulse`: opacity 1↔.3 — indicador del mapa.
- `spin`: rotación 0.7s linear — spinner de login.

---

## Estructura común (dashboards web)

Shell centrado de **1320px** máx, `background:#fff`, borde `#E2E8F0`, radius 14px, sombra elevada, `display:flex`:
- **Sidebar** 236px, `background:#0A0A0A`, texto blanco. Logo arriba (cuadro 28px radius 7px verde con icono `truck`), label de sección uppercase 11px `#475569`, items de menú (icono 17px + texto 14px/500). Item activo: bg `#1A1A1A`, texto blanco. Inactivo: texto `#94A3B8`, hover bg `#161616`. Card de usuario al fondo (`margin-top:auto`) con avatar circular de iniciales 32px.
- **Topbar** 62px, `background:#fff`, borde inferior. Coordinador: buscador (pill `#F1F5F9` 300px) + campana con badge rojo "3". Admin: título "Administración" + segmented control (Hoy/Semana/Mes, solo en Métricas).
- **Content** `flex:1`, scroll, `padding:24px`, fondo `#F8FAFC`. Cada sub-página envuelta para hacer fade-in al cambiar.

Header de página estándar: contenedor flex space-between; izquierda título 24px/700 + subtítulo 13px `#64748B`; derecha botón primario opcional (`+` icono lucide `plus` + texto).

---

## Screens / Views

### 1. Login
- **Propósito**: autenticación.
- **Layout**: grid 2 columnas `1.05fr 0.95fr`, full height.
- **Izquierda** (`#0A0A0A`, padding 56–60px, flex column space-between): logo Despachr arriba; centro con titular 36px/700 "Toda tu operación de carga, en tiempo real." + párrafo `#94A3B8` + dos stats mono (94.8% Cumplimiento / 48.3 T Movilizadas) separados por línea vertical; footer copyright 12px `#475569`. Glow radial verde decorativo top-right.
- **Derecha** (centrado, max 360px): título "Iniciar sesión" 24px/600; campos Correo y Contraseña (inputs 42px, borde `#E2E8F0`, radius 6px, focus ring verde); link "¿Olvidaste tu contraseña?" 12px verde; botón primario "Iniciar sesión" 42px (muestra spinner + "Ingresando…" ~850ms); divisor "o"; botón outline "Entrar con SSO corporativo"; pie "¿Sin cuenta? Habla con tu administrador".
- **Interacción**: al enviar → spinner → navega a la app del conductor.

### 2. App del conductor (móvil)
Marco de teléfono propio: 384×812, bezel `#0A0A0A` radius 50px padding 11px, pantalla interior radius 40px `#F8FAFC`, status bar 44px (hora `9:41` mono + iconos señal/batería), home indicator inferior. Sub-pantallas (`driverScreen`): `list` → `active` → `capture` → `done`.

**2a. Lista de entregas** (`data-screen-label="Conductor / Lista"`)
- Header oscuro con radius inferior 22px: "Ruta de hoy" / "Ruta Costa Atlántica" / "Lunes 15 de enero · Carlos Martínez · ABC-123" + avatar "CM". Barra de progreso (verde sobre pista translúcida) + "1/3" mono.
- Sección "Entregas del día" (label uppercase) + 3 cards tappables. Cada card: badge de estado con punto, ventana horaria (mono), nombre cliente 15px/600, dirección, fila inferior con peso (mono) + unidades + CTA con chevron.
- Estados de card: `delivered` (badge verde "Entregada", CTA "Ver detalle"), `onsite` (badge amarillo "En punto", borde verde + glow, CTA "Continuar"), `pending` (badge gris "Pendiente", CTA "Iniciar").

**2b. Entrega activa** (`data-screen-label="Conductor / Entrega activa"`)
- Top: botón back (chevron) + "Entrega 2 de 3" / cliente + badge estado.
- **Card timer** (`#0A0A0A`): "TIEMPO EN SITIO" + cronómetro mono 46px (mm:ss, cuenta hacia arriba en vivo) + punto verde "ping" "En curso".
- Card dirección (icono map-pin) + botones Navegar / Llamar (outline).
- Card "Carga a entregar": peso total, unidades, ventana (filas label/valor).
- CTA sticky inferior "Capturar cumplido" (primario, icono cámara).

**2c. Captura de cumplido** (`data-screen-label="Conductor / Captura cumplido"`)
- Back + "Cumplido de entrega" / cliente.
- **Evidencia fotográfica**: caja dashed tappable; al tocar → placeholder con patrón rayado + nombre "FOTO_CARGA_01.jpg" + check verde (anim pop), borde pasa a verde.
- **Firma**: caja dashed tappable; al tocar → firma manuscrita (anim pop), borde verde.
- Input "Recibido por".
- CTA sticky "Confirmar entrega": deshabilitado (gris, texto "Captura foto y firma para continuar") hasta que haya foto **y** firma; entonces primario verde.

**2d. Confirmación** (`data-screen-label="Conductor / Confirmación"`)
- Check circular verde grande (anim pop), "Entrega confirmada", mensaje con nombre del cliente.
- Card resumen: tiempo en sitio, carga entregada, evidencia "Foto + firma ✓", hora.
- Botón "Volver a la ruta" → vuelve a la lista con la entrega marcada como `delivered`.

### 3. Dashboard del coordinador (`data-screen-label="Coordinador"`)
Sidebar: Operación en vivo (activo por defecto), Rutas, Conductores, Clientes. Usuario: Valentina Páez · Coordinadora.

**3a. Operación en vivo**
- Header "Operación en vivo" + "Lunes 15 de enero · 11:24 a. m. · Actualizado hace 12 s" + badge "4 rutas activas" (verde, punto ping).
- Grid `1.7fr 1fr`:
  - **Mapa** (card, alto 380px): fondo claro con grid (repeating-linear-gradient) + dos rutas (SVG path verde sólido y ámbar punteada) + pines (círculos con borde blanco): conductor activo (verde con tooltip "Carlos M. · ABC-123" + icono truck), parada pendiente (gris), alerta (rojo con tooltip "⚠ Retrasada 35 min"). Badge "MAPA EN VIVO" top-left + leyenda bottom-left.
  - **Columna derecha**: 4 mini-stats (En ruta 3, Completadas 1, Paradas hoy 20, Retrasadas 1 en rojo) + card **Alertas** (3 items con icono triángulo; error rojo, warning ámbar).
- **Tabla "Rutas activas"**: columnas Ruta | Conductor | Vehículo | Progreso (barra+texto) | ETA | Estado (badge).

**3b. Rutas**
- Header "Rutas" + "6 rutas programadas hoy" + botón "Nueva ruta".
- 4 cards resumen: En ruta 2, Completadas 2, Programadas 1 (ámbar), Retrasadas 1 (rojo).
- Chips de filtro: Todas (activo, fondo `#0F172A`), En ruta, Completadas, Programadas, Retrasadas.
- Tabla 8 columnas: Ruta | Conductor | Vehículo | Zona | Progreso | Salida | ETA | Estado.

**3c. Conductores**
- Header "Conductores" + "6 conductores · 3 en ruta" + botón "Agregar conductor".
- Grid 3 columnas de cards: avatar iniciales (verde si en ruta, gris si no), nombre + placa (mono), badge estado; línea de ruta con icono; fila de 3 métricas (Entregas, Cumplimiento en verde, Rating ★) separadas por divisores.

**3d. Clientes (operativo)**
- Header "Clientes" + "5 clientes con operación esta semana".
- Tabla: Cliente | Ciudad | Rutas | Entregas/mes | On-time (verde) | Próx. entrega | Estado (badge).

### 4. Dashboard del admin (`data-screen-label="Admin"`)
Sidebar: Métricas (activo), Clientes, Facturación, Reportes. Usuario: Ricardo Ávila · Administrador.

**4a. Métricas**
- Topbar con segmented Hoy/Semana/Mes (Semana activo).
- Header "Desempeño de operación" + periodo.
- 4 KPI cards (label + icono en cuadro + valor mono 30px + delta verde): Cumplimiento 94.8% (▲2.1 pts), Toneladas 48.3 T (▲6.4%), Facturación $8.4M (▲12% COP), Margen 23.6% (▲0.9 pts).
- Grid `1.6fr 1fr`:
  - Card **"Toneladas movilizadas por día"**: barras CSS (gradiente verde) Lun–Dom con valor mono encima.
  - Card **"Cumplimiento global"**: anillo (conic-gradient verde 94.8% / gris) con centro blanco mostrando 94.8% "a tiempo" + leyenda.
- Tabla **"Rentabilidad por cliente"**: Cliente | Toneladas | Facturación | Margen (barra+%) | Tendencia (▲/▼ verde/rojo).

**4b. Clientes (gestión)**
- Header "Clientes" + "Cartera de clientes y contratos activos" + botón "Nuevo cliente".
- 4 cards resumen: Clientes 12, Activos 11, Toneladas/mes 246 T, Facturación/mes $42.8M.
- Tabla 8 columnas: Cliente | Ciudad | Contacto | Contrato | Ton./mes | Facturación | Margen (verde) | Estado.

**4c. Facturación**
- Header "Facturación" + "Enero 2026 · COP" + botón "Generar factura".
- 4 cards: Total facturado $42.8M, Cobrado $34.1M (verde), Pendiente $6.2M (ámbar), Vencido $2.5M (rojo).
- Tabla: Factura (mono) | Cliente | Emisión | Vencimiento | Monto (mono) | Estado (pagada/pendiente/vencida).

**4d. Reportes**
- Header "Reportes" + "Genera y descarga reportes de operación".
- Grid 4 cards de generación (icono + título + descripción + botón "Generar"): Cumplimiento, Rentabilidad, Toneladas, Conductores.
- Tabla **"Reportes recientes"**: Reporte | Periodo | Generado | Formato | acción "Descargar" (link verde con icono download).

---

## Interactions & Behavior
- **Switcher de demo** (barra flotante inferior): cambia entre Login / Conductor / Coordinador / Admin. **Es solo andamiaje del prototipo — no lo lleves a producción.** En la app real, Login → rol del usuario; cada rol ve su propio dashboard.
- **Navegación de sidebar**: cambia la sub-página dentro del dashboard; el item activo se resalta.
- **Login**: submit → estado `loggingIn` (spinner) ~850ms → navega.
- **Flujo de entrega (conductor)**: tocar entrega → `active` (timer arranca; las que están "en punto" arrancan con ~6:12 acumulados) → "Capturar cumplido" → `capture` → tocar foto y firma habilita "Confirmar" → al confirmar, la entrega pasa a `delivered` y el progreso de la ruta se actualiza.
- **Timer**: `setInterval` de 1s que solo incrementa cuando la pantalla activa es la de entrega; formato mm:ss.
- **Segmented Hoy/Semana/Mes**: cambia estado de periodo (visual).
- **Hover**: filas de tabla → `#FBFCFD`; botones primarios → `#0A5A45`; botones outline → `#F8FAFC`; items de sidebar inactivos → `#161616`.

## State Management
- `view`: `'login' | 'driver' | 'coordinator' | 'admin'`.
- `coordPage`: `'live' | 'rutas' | 'conductores' | 'clientes'`.
- `adminPage`: `'metricas' | 'clientes' | 'facturacion' | 'reportes'`.
- `driverScreen`: `'list' | 'active' | 'capture' | 'done'`.
- `deliveries[]`: cada una `{ client, city, address, window, tons, units, status: 'delivered'|'onsite'|'pending' }`. `confirm` muta el `status` de la entrega activa a `delivered`.
- `activeId`, `seconds` (timer), `capturePhoto`, `signed`, `receiver`.
- `email`, `password`, `loggingIn`, `period`.
- Datos de tablas (rutas, conductores, clientes, facturas, reportes) son arrays estáticos en el prototipo — en producción vienen de API.

## Assets
- **Iconos**: lucide (truck, map-pin, package, clock, bell, search, users, route, building, bar-chart, file-text, camera, check, chevron, alert-triangle, plus, download, phone, navigation, trending-up, dollar-sign). Usa `lucide-react`.
- **Mapa**: en el prototipo es un placeholder estilizado (grid CSS + paths SVG + pines). En producción integra un mapa real (Mapbox / Google Maps / Leaflet) con marcadores por ruta/estado.
- **Foto y firma**: placeholders. En producción → captura de cámara y canvas de firma.
- No hay logos ni imágenes propietarias; el logotipo es un cuadro verde con icono `truck` + wordmark "Despachr".

## Screenshots
Capturas de referencia en `screenshots/` (1× cada pantalla):
- `01-login.png`
- `02-conductor-lista-entregas.png`
- `03-conductor-entrega-activa.png`
- `04-conductor-captura-cumplido.png`
- `05-conductor-captura-completa.png` (foto + firma capturadas)
- `06-conductor-confirmacion.png`
- `07-coordinador-operacion-en-vivo.png`
- `08-coordinador-rutas.png`
- `09-coordinador-conductores.png`
- `10-coordinador-clientes.png`
- `11-admin-metricas.png`
- `12-admin-clientes.png`
- `13-admin-facturacion.png`
- `14-admin-reportes.png`

## Files
- `Despachr.dc.html` — prototipo completo de la app (4 experiencias + 8 sub-páginas, con tema light/dark Zinc ya aplicado). Léelo como fuente de medidas, colores y copy exactos; la lógica está en su clase `Component` (estado e interacciones) y el markup usa estilos inline.
- `UPDATE-tema-y-graficas.md` — especificación del tema Zinc (light/dark), sidebar claro y gráficas pulidas. **Fuente de verdad de color/tema.**
- `screenshots/` — 14 capturas de referencia de la app.
- *(La landing y la marca están en `../landing/` y `../brand/` — ver el README maestro.)*
