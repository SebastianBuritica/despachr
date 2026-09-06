# Despachr — Agent Context File

**This file is the durable reference for all AI agents working on Despachr** (product, domain, stack,
conventions). It is auto-loaded into every session via `CLAUDE.md`, so keep it **stable and flat** —
it should only change when a durable fact does.

- **Current state + what to do next → [STATUS.md](STATUS.md)** (a living snapshot, overwritten each session).
- **History of completed work → [CHANGELOG.md](CHANGELOG.md)** (append-only; not auto-loaded).

---

## 🎯 Purpose of This Document

This file consolidates the **durable** things an AI agent needs to understand Despachr:
- What the product is and why it exists
- Who uses it and how they use it
- Code structure, architecture decisions, and conventions
- Domain terminology and planned integrations

> For "what's done / in progress / next", do **not** look here — read STATUS.md. This keeps the
> always-loaded context flat as the project grows.

---

## 📱 What is Despachr?

**Despachr** is a Progressive Web Application for managing logistics operations in Colombian and Latin American transport companies. It digitalizes workflows currently handled with Excel and WhatsApp.

**One sentence:** The back-office of a freight company — the delivery record fills itself, and the
weekly compliance report the client receives is produced without anyone transcribing anything.

### 🧭 Tesis (leer antes de proponer cualquier feature)

Las cuatro personas del back-office hacen **el mismo trabajo**: *un documento llega por un canal
informal, un humano le extrae los datos, y los teclea en un sistema formal.*

| Persona | Documento que llega | Sistema donde lo mete |
|---|---|---|
| Isaac (coordinador) | WhatsApp + facturas físicas | SISTRAN |
| Girle (asistente) | fotos de cumplidos | el Excel del cliente |
| Yuli (contadora) | cumplidos cerrados | SISTRAN + SIGO |
| La gerente | datos operativos sueltos | propuestas e informes |

Eso no es un problema colombiano: **toda pyme logística del mundo corre sobre documentos que llegan
por canales informales.**

**El objeto único es el expediente de la entrega** (`deliveries`): una fila que acumula lo
comprometido (`fecha_programada`), lo que pasó (eventos con GPS), lo que lo prueba (cumplido,
novedad), lo que vale (flete) y lo que se reportó. Cada rol hace hoy **un salto** de esa acumulación
a mano; cada agente automatiza **un salto**. No son cuatro módulos — es un objeto y cuatro agentes.

**Los 4 agentes, en orden de dolor:**

| # | Agente | Le quita trabajo a | Estado |
|---|---|---|---|
| 1 | **Cumplido** — lee la foto de la factura firmada y cierra la entrega | Girle | pendiente ← **el siguiente** |
| 2 | **Informe** — cumplimiento semanal por cliente, redactado | Girle + gerencia | **hecho** |
| 3 | **Despacho** — del requerimiento arma la malla y notifica | Isaac | después |
| 4 | **Facturación** — el cumplido cerrado dispara la factura | Yuli | al final |

**El que NO se construye:** el de Osmelia (estados financieros, NIF, DIAN). Contabilidad regulada,
externa, con responsabilidad legal. Bajísimo apalancamiento, altísimo riesgo. Fuera del producto.

### ⚖️ REGLA DEL NÚCLEO (no negociable)

**Nada específico de un país entra al núcleo.** SISTRAN, SIGO, DIAN, RNDC, el formato de Excel de un
cliente — todos son **adaptadores en el borde**. El núcleo es el expediente + los agentes.

Respetarla cuesta $0 hoy y es lo que permite un cliente en Perú o México sin reescribir. No
respetarla siembra `sistran_sync_id` por media base de datos. Si una propuesta mete lógica de un país
en el core, **la propuesta está mal**, no la regla.

### 📏 Las tres métricas (no se cuentan pantallas)

1. **% de cumplidos cerrados sin corrección humana** (0% → 95%) — cuándo el copiloto pasa a piloto
2. **Horas de back-office liberadas por semana**
3. **Días entre entrega e informe al cliente** (hoy 15–20 → objetivo 0)

### Key Facts
- **Founder:** Sebastian Buritica
- **Pilot Client:** Family-owned logistics company in Colombia (no upfront payment — real use case)
- **Repository:** https://github.com/SebastianBuritica/despachr
- **Live App:** https://despachr.vercel.app

---

## 💼 Real Business Context (CRITICAL)

This system reflects an **actual operational workflow** from the pilot client:

**FRIDAY:** Clients send Excel sheets + PDF invoices with next week's deliveries.
> Example: "50 boxes to Makro Montería, 30 boxes to Éxito Barranquilla"

**FRIDAY-SATURDAY:** Coordinator builds the "**malla de entregas**" (delivery grid) — a consolidated multi-client plan defining what goes where each day of the week.

**MONDAY-FRIDAY:** Execution phase:
- Drivers (third-party contractors, not employees) pick up merchandise
- Update delivery status in real-time via the Despachr app
- Upon delivery, capture "**cumplido**" (proof of delivery) — photo of signed invoice

**CLOSE-OF-WEEK:** 
- Generate invoice in **Sistran** (TMS software client currently uses)
- Export XML to **SIGO** (accounting software; también factura lo que Sistran no genera — bodegaje, transporte subcontratado)
- Upload to **DIAN** (Colombian tax authority)
- **15-day** payment terms típicos (20–45 en la práctica; la rotación de cartera es dato de Osmelia)

### ⏱️ La restricción del conductor (condiciona TODO lo que se le pida)

De la reunión con la dueña (2026-08-24), y es la razón por la que los conductores **no reportan en
tiempo real hoy**:

- Mercancía **refrigerada**. Las cadenas reciben **hasta las 10–11am, máximo**.
- Los puntos abren a las 7am. Las colas de descargue llegan a **2 horas**.
- Quedan ~3 horas para 5–6 entregas. *"Si el conductor se queda organizando y tomando fotos, pierde
  tiempo."*
- Cada parada son varios documentos (factura + albarán); un solo negocio puede ser 2–3 facturas.
- Las facturas **físicas firmadas hay que devolverlas igual** — se arma un paquete semanal al cliente.

**Consecuencia de diseño:** cualquier paso nuevo que se le agregue al conductor entre 7 y 10am no se
va a usar. La única jugada viable es **no pedirle trabajo nuevo, sino el mismo por otro canal**: ya
fotografía las facturas firmadas, sólo que las manda por WhatsApp por la tarde.

> Bajo esta luz, la **firma digital** (`SignaturePad`) es evidencia **duplicada**: la firma legal ya
> está en el papel que fotografía y que además devuelve físicamente. Es candidata a borrarse —
> pendiente de confirmar con el coordinador.

### Business KPIs
- **On-time delivery %** (metric coordinators obsess over)
- **Cost per km** and margin by client
- **Consolidation rate** (% of deliveries multi-client vs exclusive)
- **Days sales outstanding (DSO)** (collection risk for owner)

---

## 👥 User Roles & Workflows

### **Admin** (Owner/Manager)
- Full system access
- Views: KPI dashboard, client profitability, driver performance, AR aging
- Actions: approve routes, manage clients, set prices

### **Coordinator** (Logistics Planner)
- Builds **malla** (weekly route plan)
- Real-time monitoring: sees truck positions on map
- Receives alerts: "Truck at point 3 for 65 minutes" → escalate to driver
- Manages live delivery state and captures issues
- Cannot see financials

### **Driver** (Third-party Contractor)
- Mobile-first PWA (no app store, no install)
- Views: only HIS deliveries for the day
- Actions: mark arrival/departure, capture cumplido photo, report issues (novedades)
- Cannot see routes, pricing, or other drivers

---

## 📋 Domain Terminology (USE THESE TERMS ALWAYS)

| Term | Definition |
|------|-----------|
| **cumplido** | Proof of delivery — photo of invoice signed by receiver |
| **malla** | Weekly consolidated delivery plan (multi-client routes) |
| **novedad** | Any problem during delivery (rejection, shortage, damage, etc). **Reporting one CLOSES the delivery** — `deliveries.estado='novedad'` is terminal like `entregado`, and `check_route_completion` already counts it as closed, so a route completes with novedades inside. The driver reports and moves on; resolving it is the coordinator's job. |
| **flete** | Payment to driver/transporter for the service |
| **despacho** | Shipment/delivery of merchandise |
| **manifiesto de carga** | Legal shipping document |
| **paqueteo** | Small parcels charged by weight, not per box |
| **consolidado** | Multiple clients in same truck |
| **exclusivo** | Full truck for one client only, fixed rate |
| **Sistran** | TMS (Transport Management System) — client's main software |
| **SIGO** | Software contable. Factura a la DIAN lo que Sistran no genera (bodegaje, transporte subcontratado); se enlaza con Sistran por XML |
| **anexo** | Cargo extra sobre el flete que va en el manifiesto (p. ej. ~100k por descargue) |
| **generador de carga** | El cliente que origina el despacho (p. ej. Casablanca). El destino es la tienda, no el cliente |
| **DIAN** | Colombian Tax Authority |
| **punto** | Stop/delivery location on a route |
| **evento** | Timestamped action: arrival, departure, photo, issue report |

---

## 🏗️ Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS 4 (CSS `@theme`, sin config JS) |
| **UI kit** | **shadcn/ui + Radix** (preset radix-nova) · `cn()` con `tailwind-merge` |
| **Theming** | **next-themes** (light/dark, `system` por defecto, toggle sol/luna) |
| **Icons** | `lucide-react` |
| **Fonts** | Inter (UI) + JetBrains Mono (cifras/placas/montos) vía `next/font` |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth — **two login paths at `/login`, in tabs**: **phone/SMS-OTP** (default; drivers) and **email/password** (admin/coordinator), plus password reset. OTP calls `signInWithOtp` with **`shouldCreateUser: false`** — sign-in never creates accounts; users are admin-provisioned and public signup is off. `profiles.phone` / `auth.users.phone` are stored **without** the leading `+` (e.g. `573229596618`) — always go through `lib/phone.ts` (`normalizePhone` to send, `formatPhoneDisplay` to show, `toTelHref` for dialing). |
| **Storage** | Supabase Storage — bucket privado `cumplidos`; **conectado** al cumplido del conductor (foto + firma, Fase 1.2) vía `lib/storage.ts` |
| **Realtime** | Supabase Realtime — **conectado** en la app del conductor (routes/deliveries, Fase 1.1/1.2); el mapa del coordinador es pendiente (Fase 2) |
| **Deploy** | Vercel (auto-deploy from main) |
| **Maps** | **MapLibre GL + tiles CARTO** (`dark_all`/`light_all` según el tema). Sin token ni cuenta de facturación — misma razón por la que la landing ya usaba CARTO. El mapa dibuja las entregas por `deliveries.latitude/longitude` y la **última posición conocida** de cada ruta desde `delivery_events` (no hay tracking continuo en el schema: el último evento con coords es el mejor dato real, y por eso la UI muestra su hora). |
| **Alerts** | Tabla `alerts` **conectada** en el panel del coordinador (ver + resolver, con constancia de quién y cuándo). La **llena** la edge function `check-tiempo-en-punto` con service role — el coordinador no tiene policy de INSERT a propósito. Telegram sigue pendiente de desplegar. |

---

## 🎨 Sistema de diseño (light/dark, escala Zinc)

Definido con CSS custom properties en `app/globals.css` (`:root` = light, `.dark` = dark),
mapeadas a las variables de shadcn. Verde de **marca constante** en ambos modos.

```
Marca:      #0F6E56 (primario, FONDOS) · #1D9E75 (brand-light / hover / destino)
            #brand-ink → verde para TEXTO (se aclara en oscuro; ver abajo)
Neutros:    escala Zinc (bg #FAFAFA/#09090B, card #FFFFFF/#18181B, border #E4E4E7/#27272A…)
Panel:      #18181B (--panel) → superficies oscuras intencionales
            (login, header/timer del conductor, badge del mapa) en ambos modos
```

### Uso (utilidades por token, NO escalas `-600`)
```tsx
className="bg-primary text-primary-foreground"   // botón primario (verde)
className="bg-card text-foreground border-border" // superficies (adaptan a tema)
className="bg-brand / text-brand / bg-panel"      // acentos de marca / panel oscuro
className="bg-muted text-muted-foreground"        // neutros
// StatusBadge (components/ui/status-badge.tsx): tones success/neutral/danger/warning
```
> El toggle sol/luna vive en el topbar del `DashboardShell`. La **landing es oscura fija**
> (colores explícitos, no usa el toggle). Fuentes: `font-sans` (Inter) / `font-mono` (JetBrains).

### Contraste (WCAG AA) — reglas que ya costaron una corrección
- **Texto verde → `text-brand-ink`, nunca `text-brand`.** `--brand` (#0F6E56) es color de FONDO:
  blanco encima da 6.20:1, pero como texto sobre superficie oscura da **2.86:1** y falla. `--brand-ink`
  se aclara a #1D9E75 en modo oscuro (5.23:1). `--brand` NO puede aclararse: blanco sobre #1D9E75
  sólo da 3.39:1, así que los fondos se romperían.
- **`--faint` es el gris más claro permitido para texto**, y ya está en el límite (4.83:1 en claro,
  4.85:1 en oscuro). Cualquier cosa más clara falla — #A1A1AA sobre blanco da **2.56:1**. En modo
  claro coincide con `--muted-foreground` a propósito: sobre blanco no hay margen entre "legible" y
  "más tenue".
- Al agregar un par color/fondo nuevo, calcular el ratio antes de darlo por bueno. El objetivo es
  **4.5:1** para texto normal y 3:1 para texto grande o gráficos.

---

## 📁 Project Structure

> **Service worker (`public/sw.js`)** — registrado SÓLO bajo `/driver` (el único rol que trabaja sin
> señal; coordinación y admin operan con wifi de oficina) y sólo en producción (un shell cacheado
> peleando con el HMR de Turbopack es un bug fantasma caro). Navegaciones: **red primero** con caída
> al shell cacheado — nunca caché primero, o un despliegue tardaría en llegarle al conductor.
> `/_next/static/**`: caché primero (llevan hash, son inmutables). **Supabase, `/api/` y cualquier
> otro origen: jamás se cachean.** Sin Workbox ni next-pwa: son ~40 líneas.

### `/app` — Next.js Routes
```
app/
├── (auth)/login/          # Login split público (registro público eliminado)
│   ├── forgot-password/   #   Pide el enlace de recuperación (no revela si el correo existe)
│   └── reset-password/    #   Fija la contraseña nueva (sesión de recuperación vía ?code=)
├── dashboard/             # COORDINADOR (protegido, solo rol coordinador)
│   ├── page.tsx           #   Operación en vivo
│   ├── rutas/ conductores/ clientes/   # sub-páginas
│   └── layout.tsx         #   → <DashboardShell variant="coordinator">
├── admin/                 # ADMIN (protegido, solo rol admin) — UNA pantalla, a propósito
│   ├── page.tsx           #   Informe de cumplimiento (cifras + análisis redactado)
│   └── layout.tsx         #   → <DashboardShell variant="admin">
├── api/informe/route.ts   # Agente 2: redacta el informe. La llave NUNCA va al navegador
├── driver/                # CONDUCTOR (protegido) → <DriverApp/> (mobile)
├── page.tsx               # Landing (pública, oscura fija)
├── manifest.ts            # PWA manifest (iconos, standalone)
└── layout.tsx             # Root: ThemeProvider + Tooltip + Toaster + metadata iconos
```
> Ruteo por rol en `middleware.ts` — `homeForRole`: admin→`/admin`, coordinador→`/dashboard`,
> conductor→`/driver`. Cada segmento protegido por su rol.

### `/components` — React Components

**UI (`/components/ui/`)** — primitivos **shadcn** en minúsculas (button, card, input, label,
badge, table, tabs, avatar, progress, separator, dialog, sheet, dropdown-menu, skeleton,
tooltip, sonner) + `status-badge.tsx` (badges de estado: success/neutral/danger/warning).

**Layout (`/components/layout/`)**:
- `DashboardShell.tsx` — shell reutilizable (frame 1320px + **sidebar claro** Linear + topbar
  con toggle de tema + user card con logout). Prop `variant: 'coordinator' | 'admin'`.
- `PageHeader.tsx` — header de página estándar (título + subtítulo + acción).

**Dashboard (`/components/dashboard/`)**: `StatCard`, `RouteProgress`, `LiveClock`, `LiveMap` (MapLibre real),
`AlertsCard`, `DriverCard`, `RoutesTable` (filtros), `KpiCard`, `TonnageChart`, `ComplianceRing`,
`PeriodToggle`.

**Driver (`/components/driver/`)**: `DriverApp.tsx` — state machine `list→active→capture→done`
(timer, captura foto/firma placeholder, confirmación).

**Landing (`/components/landing/`)**: `LiveMapCard` (mapa real CARTO + ruta animada),
`DemoMockup` (dashboard en light), `ProductFeatures`, `HowItWorks`, `Pricing`, `Reveal` (scroll).

**Otros**: `theme/ThemeProvider` + `theme/ThemeToggle` · `brand/BrandMark` (isotipo Ruta-D).
El logout vive en el user card del `DashboardShell`; no hay componente `LogoutButton` suelto.

> **No queda un solo mock.** `lib/mock/` se borró el 2026-08-30 junto con las tres pantallas de
> admin que lo consumían. Toda pantalla lee de Supabase. Si vuelve a aparecer un dato inventado
> en la UI, es un bug, no un placeholder.

### `/lib` — Utilities & Clients
- `offline/` — resiliencia sin señal del conductor: `db.ts` (IndexedDB, sin librería),
  `snapshot.ts` (última ruta conocida: el SW sirve el shell, pero las entregas vienen de Supabase y
  **esas peticiones nunca se cachean** — servir la ruta de ayer como si fuera la de hoy es peor que
  no mostrar nada; el snapshot se usa SÓLO si la carga falla y la UI dice de qué hora es el dato),
  `cola.ts` (orden + corte + reintento, con dobles en las pruebas), `sync.ts` (cableado real).
  **Los eventos llevan `id` y `timestamp` de CLIENTE** (`nuevaIdentidadEvento`): el id da
  idempotencia (choque de PK al reenviar = ya estaba) y el timestamp guarda cuándo PASÓ el hecho,
  no cuándo se pudo enviar — sin eso, `hora_llegada_punto` y `tiempo_en_punto_minutos` quedarían
  con la hora del sync.
- `queries/coordinator.ts` — camino de datos del COORDINADOR. **No reusar `entregas_de_ruta`**: esa
  RPC filtra por `driver_id = auth.uid()`, así que para el coordinador devuelve vacío. No hace falta
  RPC — la RLS ya le da SELECT directo. Deriva lo que el schema no guarda en vez de inventarlo:
  `routes` no tiene nombre ni zona → se muestran las **ciudades de sus puntos**; no hay ETA en
  ninguna parte → se muestra la hora de cierre **real**; `retrasada` = alguna entrega >60 min en el
  punto, **el mismo umbral que la edge function de alertas** (si difirieran, tablero y alertas se
  contradirían).
- `estados.ts` — presentación de estados del schema (antes vivía en el mock) · `fecha.ts` —
  `hoyOperacion()` en zona Colombia, compartida por conductor y coordinador
- `cumplido.ts` / `novedad.ts` — orquestación de los dos cierres posibles de una entrega
  (entregada o con novedad). Misma forma: dependencias inyectadas, progreso mutable para reanudar,
  y el cambio de estado SIEMPRE de último. Ambas probadas y ambas encolables offline.
- `cumplimiento.ts` — la ARITMÉTICA del informe (probada). Vive fuera de `queries/` para poder
  probarse sin red. Dos decisiones que no son obvias: el % se calcula **sólo** sobre entregas con
  `fecha_programada` y el informe **declara cuántas excluyó** (una base recortada en silencio se ve
  idéntica a una buena); y "a tiempo" se compara a nivel de FECHA, porque el compromiso que manda el
  cliente es un día, no una hora.
- `queries/reporte.ts` — el camino de datos del informe. Recibe el cliente de Supabase **inyectado**
  (como `cumplido.ts`): la página pasa el del navegador, la API uno de servidor. Filtra por la fecha
  de la RUTA, no por `fecha_programada` — filtrar por ella escondería justo las entregas sin
  compromiso que el cálculo intenta hacer visibles.
- `exportadores/casablanca.ts` — el formato exacto del cliente ("RELACION DE ENTREGAS...", columnas
  B-J), fuera del núcleo a propósito (regla del núcleo, arriba): el día que llegue el cliente #2 con
  su propio Excel, se agrega `exportadores/<cliente>.ts` y este archivo no se toca.
- `ia/informe.ts` y `ia/cumplido.ts` — dónde viven los dos agentes de IA (redactar el informe, leer
  el cumplido escaneado). **Eligen proveedor por variable de entorno, no por parámetro**: con
  `ANTHROPIC_API_KEY` usan Claude; sin ella, y con `GEMINI_API_KEY`, caen a Gemini (respaldo agregado
  2026-09 mientras el pago de la consola de Anthropic estuvo trabado). Las rutas (`app/api/informe`,
  `app/api/cumplidos`) no saben cuál corrió — sólo hacen auth y arman la respuesta. Dos esquemas de
  salida estructurada por agente, uno por dialecto (Claude: JSON Schema con `type: [x,"null"]`;
  Gemini: tipos en MAYÚSCULA + `nullable: true`) — no son intercambiables como objeto.
- `supabase.ts` — Supabase client initialization
- `utils.ts` — Helpers: `cn()`, `formatDate()`, `calculateDistance()`

### `/types` — TypeScript Domain Models (9 types)
```typescript
User              // Base user (id, email, name, role, phone)
Driver            // Extends User (vehicleId, licensePlate, documentNumber)
Route             // Daily route (id, driverId, date, status, deliveries[])
Delivery          // Single stop (id, address, lat/lon, status, times, photo)
Event             // Timestamped action (arrival, departure, photo_captured, note_added)
Client            // Customer/company (name, email, address, city, department)
Issue             // Problem report (type, description, photo, status)
Metrics           // Dashboard KPIs (deliveries, distance, on-time %)
UserRole          // Enum: 'admin' | 'coordinator' | 'driver'
```

### `/hooks` — React Hooks
- `useAuth.ts` — Returns `{ user, profile, rol, loading, error, signOut }` from Supabase

### `/scripts` — Automation (5 scripts)
- `deploy.sh` — Validates build, then `vercel deploy --prod`
- `github-workflow.sh` — Create branches, PRs, sync, cleanup
- `db-create-tables.js` — Outputs SQL for full schema
- `setup-env.sh` — Configure .env.local from environment vars
- Plus: npm scripts in package.json for easy access

### `.claude/` — Claude Code Configuration
- `settings.json` — Skills definitions for AI agents

---

## 🛡️ Architecture Decisions (DO NOT CHANGE WITHOUT JUSTIFICATION)

| Decision | Rationale |
|----------|-----------|
| **PWA, not native app** | No app store friction, auto-updates, works offline |
| **Supabase over other DBaaS** | PostgreSQL, Auth, Realtime, Storage all-in-one; RLS for security |
| **Alertas in-app primero; el canal de push queda ABIERTO** | El registro de verdad es la tabla `alerts`, que el coordinador ve en vivo por Realtime y resuelve desde el panel. El envío externo es *best-effort* y desacoplado (~20 de 134 líneas de la edge function), así que cambiar de canal es un swap, no un rediseño. **Telegram quedó desplegado pero SIN configurar a propósito** — se eligió por facilidad de integración, no por encaje de mercado: en Colombia WhatsApp es universal y Telegram es nicho. Ver la nota de decisión abajo. |
| **Cumplido photos in Supabase Storage** | Keeps all data in one ecosystem; easy backups |
| **Timer on server (cron), not client** | Accurate alerts; not dependent on driver's phone staying awake |
| **RLS (Row Level Security)** | Database enforces role-based access, not application logic |
| **Realtime for map updates** | Instant visibility of truck movements |
| **API routes in `/app/api`** | Server-side handlers for sensitive operations |

---

## 📏 Code Conventions (ALWAYS FOLLOW)

### File Organization
```
components/[domain]/ComponentName.tsx       # PascalCase, exported as default
hooks/useHookName.ts                         # use prefix, custom logic
lib/[module].ts                              # exports, not default
types/index.ts                               # all domain types, no inline types in components
app/api/[resource]/route.ts                  # POST /api/resource → app/api/resource/route.ts
```

### TypeScript
```typescript
// ✅ CORRECT
import type { User, Driver } from '@/types'

const handleUpdate = (user: User) => {
  // ...
}

// ❌ WRONG — never inline types in components
interface LocalType {
  id: string
}
```

### Tailwind Classes
```typescript
// ✅ CORRECT — use cn() for conditionals
import { cn } from '@/lib/utils'

className={cn(
  "px-4 py-2",
  isActive && "bg-primary-600 text-white"
)}

// ❌ WRONG — string interpolation
className={`px-4 py-2 ${isActive ? "bg-primary-600" : ""}`}
```

### Tests
```
lib/[module].test.ts     # Vitest, entorno node, junto al módulo que prueban
npm test                 # corre todo
```
Se prueba **lógica que se rompe en silencio**, no pantallas: el orden y la
reanudación del cumplido (`lib/cumplido.ts`) y la normalización de teléfonos
(`lib/phone.ts`). El recorrido visual de las 42 pantallas ya lo cubre el barrido
de Playwright (`npm run qa`), que es otra herramienta para otro problema.

> **Por qué `lib/cumplido.ts` existe:** cerrar la entrega es el paso menos
> perdonable de la app — si falla a medias, el conductor cree que entregó y la
> operación cree que no. Dentro de `DriverApp` estaba enredado con refs y estado
> de React, así que no había forma de probar el reintento sin montar la pantalla
> entera. Con las dependencias inyectadas se verifica el orden real (el flip a
> `entregado` SIEMPRE de último) y que un reintento **reanude** en vez de
> reiniciar. La Fase 1.4 lo hereda: la cola offline necesita interceptar
> exactamente esas cuatro operaciones.

### Environment Variables
```
// ✅ Always in .env.local, never hardcoded
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// ❌ WRONG
const apiUrl = 'http://localhost:3000'
```

### Git Commits
```bash
# ✅ Conventional commits
git commit -m "feat: add real-time position tracking"
git commit -m "fix: coordinator alert delay logic"
git commit -m "chore: update dependencies"
git commit -m "docs: update AGENTS.md"

# ❌ WRONG
git commit -m "updates"
git commit -m "fix stuff"
```

### Comments (Minimal)
```typescript
// ✅ Comment WHY, not WHAT (code shows what)
// DECISION: Timer runs server-side to avoid gaps when driver's phone sleeps
const checkInactivityInterval = setInterval(...)

// ❌ WRONG — states obvious
// Set the timer interval
const checkInactivityInterval = ...
```

---

## 🚦 v1 Scope — what "done" means

**v1 is the minimum that replaces the pilot client's WhatsApp + Excel daily operation. Nothing more.**
Work is executed **one segment = one branch = one PR**; each PR must pass `build` + `lint` + `qa`
before it's proposed. Current state and the active segment live in **STATUS.md**.

**In scope for v1:**
- **Driver app on real data** — today's own deliveries, GPS on arrival/departure, real photo +
  signature capture to Storage, **novedades** reporting, offline resilience.
- **Coordinator panel on real data** — live route status, real map, visible alerts.
- **Alerts live end-to-end** — `pg_cron` + edge function insertando en `alerts`, visibles y resolubles en el panel. **El push externo NO es requisito de v1.**
- **Resilience/UX baseline** — error/loading/not-found boundaries and empty states.

**In scope for v1 (añadido 2026-08-30, tras la reunión con la dueña):**
- **Informe de cumplimiento por cliente** — el entregable que hoy se arma llenando a mano el Excel
  del generador de carga y filtrándolo antes de la reunión del viernes. Es el **único artefacto del
  producto que ve el cliente que paga**, y por eso pesa más que cualquier pantalla interna.

**Out of scope for v1 (deferred):**
- **Admin panel depth** — KPIs, charts, billing workflow, client CRUD → **cancelado, no diferido.**
  Las tres pantallas mock se **borraron** el 2026-08-30. No eran una deuda a completar: eran vistas
  para mirar, y ninguna le quitaba trabajo a nadie. Lo que sí lo quita es el agente de cumplido.
- Multi-tenant, pricing, route optimization, Sistran/SIGO integration → **post-v1**.
- The a11y contrast backlog (35 axe warnings) → tracked, **not v1**.

### Sequence
```
Fase 1.0  — infra scaffolding (error/loading/not-found + empty states + UX hardening)   [done]
Fase 1.1  — driver: real data + GPS                                                     [done]
Fase 1.2  — driver: real photo + signature capture                                     [done]
Fase 1.3  — driver: novedades UI                                                        [done]
Fase 1.3b — driver: OTP login UI (phone sign-in)                                        [done]
Fase 1.4  — driver: cola offline (IndexedDB) + service worker + snapshot de ruta   [done]
Manual    — Telegram bot + pg_cron deploy (owner runs these)
Fase 2.1  — coordinator: real routes/drivers/clients + Realtime                          [done]
Fase 2.2  — coordinator: mapa real (MapLibre+CARTO) + alertas conectadas                 [done]
Fase 3.1  — informe de cumplimiento + agente redactor (migración 008)                    [done]
Fase 3.2  — agente de CUMPLIDO: lee la foto, cierra la entrega  ← EL SIGUIENTE
Fase 3.3  — multi-tenant (`company_id` + reescribir las 27 policies) → cliente #2
```

> **Fase 3.2 se despacha en modo COPILOTO, no autopiloto.** El modelo propone los campos, un humano
> confirma con un toque. Razón: arranca al ~70% de precisión, y un agente autónomo al 70% es
> inservible mientras que un copiloto al 70% ya ahorra el día. La **tasa de confirmación sin
> corrección** es la métrica que decide cuándo se quita el humano — no la fe.

> **Auth reality:** phone/SMS-OTP login **is built** (Fase 1.3b) — `/login` shows two tabs, phone
> first. Phone numbers have **no leading `+`** anywhere in the DB (`573229596618`); never build a
> number by hand, use `lib/phone.ts`. `telefono_receptor` is coordinator-typed free text, so it must
> be normalized before it becomes a `tel:` href.
>
> **Canal de alertas — decisión (2026-08-17).** Sólo **el coordinador** (y quizá el dueño) necesita
> recibir la alerta: los conductores y los clientes no. Son 1-2 personas, no un equipo. Como el panel
> ya las muestra en vivo, **el push externo es una escalación, no el sistema**. Orden acordado:
> (1) in-app, ya funcionando; (2) **SMS por Twilio** si la coordinadora reporta que se le pasan
> estando lejos de la pantalla — reusa la cuenta que ya existe para el OTP y no exige instalar nada;
> (3) **WhatsApp** cuando haya un cliente pagando. Telegram se descarta: se eligió por lo fácil de
> integrar, y en Colombia casi nadie lo usa.
>
> **Tensión que vale la pena tener presente:** este producto se vende para *reemplazar* la
> coordinación por WhatsApp. Mandar las alertas de vuelta a WhatsApp refuerza el hábito contra el que
> se compite. La alerta in-app con botón de resolver mantiene a la coordinadora en la herramienta,
> donde puede actuar, en vez de en un chat donde va a teclearle al conductor.
>
> **Public signup must stay OFF.** "Allow new users to sign up" is a project-level Supabase setting,
> independent of the app having no signup UI. It was ON from project creation until 2026-08-16; with
> the pre-`007` `handle_new_user` that meant anyone holding the anon key (it ships in the JS bundle)
> could sign up as `admin`. It is now OFF and stays OFF: users are admin-provisioned. **This is why
> `signInWithOtp` passes `shouldCreateUser: false`** — the two are halves of one decision. A number
> that isn't provisioned gets "pídele a tu coordinador que te dé de alta", not a silently created
> account. Phone provider stays enabled (it's the OTP transport); disabling *signup* is what closed
> the hole, not disabling phone.

> Reusable primitives added in Fase 1.0: `components/ui/empty-state.tsx` (icon + title + message +
> action) and `components/ui/coming-soon.tsx` (wraps a `disabled` control with a "Próximamente"
> tooltip so unbuilt CTAs read as pending, not broken).
>
>
> **`demo-data-notice.tsx` ya no existe** — cumplió su función y se borró con el último mock
> (2026-08-30), exactamente como decía su propia regla. La lección que deja: un CTA muerto se ve
> muerto, pero una métrica inventada se lee igual que una real. Por eso ahora la regla es más dura:
> **no hay pantallas de relleno.** Si algo no tiene datos reales, no se despacha.

---

## 🔌 Future Integrations (Planned)

| Integration | Purpose | Status |
|-------------|---------|--------|
| Google Maps API | Route optimization, visual routes | Design phase |
| Sistran API | Auto-import routes (if API exists) | Investigate |
| ~~Telegram Bot~~ | Push alerts to coordinator | **Desplegado, sin configurar — y así se queda.** Canal equivocado para el mercado |
| SMS (Twilio) | Escalar alertas si el coordinador las pierde | **Siguiente paso si hace falta** — la cuenta Twilio ya existe (OTP), no requiere instalar nada |
| WhatsApp Business API | Alertas para clientes que paguen | **Cuando haya cliente pagando.** Requiere verificación de Meta + *plantilla aprobada* (una alerta es business-initiated, fuera de la ventana de 24 h), así que no se empieza en especulativo |
| Wompi | Charge Colombian customers | Backlog |
| Stripe | Charge international customers | Backlog |

---

## 🤖 AI Agent Skills (Configured in `.claude/settings.json`)

### Deployment
- `/deploy-vercel` → `vercel deploy --prod`
- `/preview-vercel` → `vercel deploy` (staging)
- `/env-vercel` → `vercel env list production`

### GitHub
- `/github-pr-create` → Create PR with title and body
- `/github-pr-list` → List open PRs
- `/github-issue-create` → Create issue

### Build & Dev
- `/build-local` → `npm run build`
- `/dev-server` → `npm run dev`
- `/lint-check` → `npm run lint`

### Supabase
- `/supabase-status` → Check project status (requires token)

---

## 📋 npm Scripts (from package.json)

```bash
# Development
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # TypeScript + build check
npm run start            # Prod server
npm test                 # Vitest — pruebas de lógica (lib/**/*.test.ts)
npm run test:watch       # Vitest en watch

# Deployment
npm run deploy           # Deploy to Vercel (prod)
npm run vercel:preview   # Deploy to Vercel (preview)
npm run vercel:prod      # Same as deploy
npm run vercel:list      # List env vars in Vercel

# GitHub Workflow
npm run gh:feature       # Create feature/[name] branch
npm run gh:bugfix        # Create bugfix/[name] branch
npm run gh:pr            # Create PR from current branch to main
npm run gh:sync          # Rebase on latest main
npm run gh:cleanup       # Delete merged branches

# Database
npm run db:create-tables # Output SQL to create schema

# Setup
npm run setup-env        # Configure .env.local
npm run lint             # ESLint validation
```

---

## 📊 Project Status

> **Current state & what to do next → [STATUS.md](STATUS.md).**
> **Full change history → [CHANGELOG.md](CHANGELOG.md).**
>
> AGENTS.md is *durable reference* — product, domain, stack, conventions. It should rarely change.
> Do **not** grow a per-session status log here: overwrite STATUS.md for current state, and append
> a short paragraph to CHANGELOG.md for history. That keeps this always-loaded file flat as the
> project grows.

---

## 🚀 Quick Start for New Sessions

1. **Read this file** (AGENTS.md) — durable product / domain / stack / conventions reference.
2. **Read [STATUS.md](STATUS.md)** — current build state + exactly what to do next.
3. **Confirm with the user** what will be worked on today.
4. **At end of session:** *overwrite* STATUS.md with the new state, and append a short paragraph to
   [CHANGELOG.md](CHANGELOG.md). Leave AGENTS.md unchanged unless a **durable** fact changed
   (stack, conventions, architecture, terminology).

---

## 📚 Additional Documentation

- **STATUS.md** — Living snapshot of current state + "what's next" (overwritten each session; read this for state)
- **SUPABASE-PENDIENTE.md** — Runbook of the remaining Supabase configuration (the last of v1 is config, not code) + **how to enable an agent to help**: export `SUPABASE_ACCESS_TOKEN` *before* launching, since MCP tools register at session start and `supabase login` needs a TTY it does not have
- **CHANGELOG.md** — Append-only history of completed work (PR ledger + per-segment detail; not auto-loaded)
- **QA-E2E-AUDIT-2026-07-24.md** — Latest QA audit (re-run confirming the PR #15 fixes); `QA-E2E-AUDIT.md` is the prior (2026-07-04) one
- **README.md** — Installation, setup, deployment
- **scripts/README.md** — Detailed script documentation
- **scripts/schema.sql** — Base DB schema · **scripts/migrations/`001`–`007`** — hand-run, repo-tracked migrations (executed in prod). `005` adds the driver-only `entregas_de_ruta` SECURITY DEFINER RPC (client name without leaking pricing) + hardens `get_my_role()`'s `search_path`; `006` adds `deliveries.recibido_por`/`firma_url` and extends the RPC to return the cumplido evidence; **`007` closes the privilege-escalation holes** — RLS is row-level, so column protection needs triggers (`protect_profile_columns`: only an admin changes `profiles.role`; `protect_delivery_columns`: a driver can't write `valor_flete`), plus `handle_new_user` reading the role from **`app_metadata`** (service_role-only) instead of client-writable `user_metadata`, and `revoke execute` on `seed_demo_data`.
- **Provisioning rule (post-`007`):** a new user's role comes from **`app_metadata`**, never `user_metadata`. From the dashboard, create the user (it defaults to `conductor`) then promote with `update public.profiles set role=… ` in the SQL Editor — that path works because the SQL Editor has no JWT (`auth.uid()` is NULL) and the trigger allows it; the same statement from the app is rejected with `42501`.
- **supabase/functions/check-tiempo-en-punto/README.md** — Deploy + `pg_cron` scheduling steps for the 60-min alert function (pending manual deploy)
- **.env.local.example** — All environment variables
- **.claude/settings.json** — AI agent skills configuration
- **types/index.ts** — All TypeScript domain types
- **GitHub:** https://github.com/SebastianBuritica/despachr

---

## ✨ Summary

Despachr is a **real, solvable problem** for Colombian logistics companies: a role-based logistics PWA
(schema + RLS + auth + a full UI) that replaces the Excel/WhatsApp workflow. **For the current build
state and the next step, see [STATUS.md](STATUS.md); for history, [CHANGELOG.md](CHANGELOG.md).**

**Key principle:** Every feature should map to actual user actions:
- Driver marks "arrived" → Event created with timestamp + GPS → Alert to coordinator
- Coordinator sees truck delayed → Phone call to driver → Issue reported → Cumplido photo validates resolution

**Never add features that don't serve the three user types.**
