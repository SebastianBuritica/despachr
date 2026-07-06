# Despachr — Agent Context File

**This file is the single source of truth for all AI agents working on Despachr.**
**READ THIS FILE COMPLETELY BEFORE WRITING ANY CODE.**
**Update the "Project Status" section at the end of every work session.**

---

## 🎯 Purpose of This Document

This file consolidates everything an AI agent needs to understand Despachr:
- What the product is and why it exists
- Who uses it and how they use it
- Current code structure and architecture decisions
- What's done, what's in progress, what's pending
- Conventions, integrations, and terminology

---

## 📱 What is Despachr?

**Despachr** is a Progressive Web Application for managing logistics operations in Colombian and Latin American transport companies. It digitalizes workflows currently handled with Excel and WhatsApp.

**One sentence:** Real-time logistics management PWA that replaces manual tracking with digital, mobile-first operations.

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
- Export XML to **Cigo** (accounting software, integrated with Sistran)
- Upload to **DIAN** (Colombian tax authority)
- 30-day payment terms to client

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
| **novedad** | Any problem during delivery (rejection, shortage, damage, etc) |
| **flete** | Payment to driver/transporter for the service |
| **despacho** | Shipment/delivery of merchandise |
| **manifiesto de carga** | Legal shipping document |
| **paqueteo** | Small parcels charged by weight, not per box |
| **consolidado** | Multiple clients in same truck |
| **exclusivo** | Full truck for one client only, fixed rate |
| **Sistran** | TMS (Transport Management System) — client's main software |
| **Cigo** | Accounting software integrated with Sistran |
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
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (cumplido photos) — pendiente conectar |
| **Realtime** | Supabase Realtime (map updates) — pendiente conectar |
| **Deploy** | Vercel (auto-deploy from main) |
| **Maps** | Placeholder estilizado; en producción MapLibre/Mapbox (ver memoria) |
| **Alerts** | Telegram Bot API (future) |

---

## 🎨 Sistema de diseño (light/dark, escala Zinc)

Definido con CSS custom properties en `app/globals.css` (`:root` = light, `.dark` = dark),
mapeadas a las variables de shadcn. Verde de **marca constante** en ambos modos.

```
Marca:      #0F6E56 (primario) · #1D9E75 (brand-light / hover / destino)
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

---

## 📁 Project Structure

### `/app` — Next.js Routes
```
app/
├── (auth)/login/          # Login split público (registro público eliminado)
├── dashboard/             # COORDINADOR (protegido, solo rol coordinador)
│   ├── page.tsx           #   Operación en vivo
│   ├── rutas/ conductores/ clientes/   # sub-páginas
│   └── layout.tsx         #   → <DashboardShell variant="coordinator">
├── admin/                 # ADMIN (protegido, solo rol admin)
│   ├── page.tsx           #   Métricas
│   ├── clientes/ facturacion/ reportes/
│   └── layout.tsx         #   → <DashboardShell variant="admin">
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

**Dashboard (`/components/dashboard/`)**: `StatCard`, `RouteProgress`, `LiveMap` (placeholder),
`AlertsCard`, `DriverCard`, `RoutesTable` (filtros), `KpiCard`, `TonnageChart`, `ComplianceRing`,
`PeriodToggle`.

**Driver (`/components/driver/`)**: `DriverApp.tsx` — state machine `list→active→capture→done`
(timer, captura foto/firma placeholder, confirmación).

**Landing (`/components/landing/`)**: `LiveMapCard` (mapa real CARTO + ruta animada),
`DemoMockup` (dashboard en light), `ProductFeatures`, `HowItWorks`, `Pricing`, `Reveal` (scroll).

**Otros**: `theme/ThemeProvider` + `theme/ThemeToggle` · `brand/BrandMark` (isotipo Ruta-D) ·
`auth/LogoutButton`.

> Datos **mock** en `lib/mock/{coordinator,admin,driver}.ts` (en producción → Supabase/API).

### `/lib` — Utilities & Clients
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
| **Alerts via Telegram Bot** | Coordinator already lives in Telegram/WhatsApp |
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

## 🔌 Future Integrations (Planned)

| Integration | Purpose | Status |
|-------------|---------|--------|
| Google Maps API | Route optimization, visual routes | Design phase |
| Sistran API | Auto-import routes (if API exists) | Investigate |
| Telegram Bot | Push alerts to coordinator | Design phase |
| WhatsApp Business API | Future alerts (backup to Telegram) | Backlog |
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

**Last Updated:** 2026-07-04

### 🧭 Estado actual (resumen)
**Todo el rediseño visual está implementado con datos mock.** El login es real (Supabase
Auth + ruteo por rol); todas las pantallas (login, coordinador ×4, admin ×4, conductor,
landing) están construidas con shadcn/ui, con **light/dark mode** y **iconos de marca** oficiales.
La landing es de marketing (oscura fija) con ritmo claro/oscuro. **Lo pendiente es conectar a
datos reales de Supabase** (reemplazar `lib/mock/*`) + integraciones reales (cámara/firma en
Storage, mapa real, Realtime). Credenciales de QA: `.env.qa-credentials` (git-ignored).
Deploy vivo: https://despachr.vercel.app

### ✅ Completed
- [x] Next.js 14 boilerplate with TypeScript + Tailwind
- [x] Folder structure designed for scalability
- [x] 13 reusable UI components
- [x] 9 TypeScript domain models (Spanish enums, aligned to schema)
- [x] Supabase client configured (client + server sides)
- [x] `useAuth` hook for session management
- [x] Middleware to protect routes by role
- [x] GitHub repository (SebastianBuritica/despachr)
- [x] Vercel deployment live with auto-deploy
- [x] 5 automation scripts (deploy, GitHub, DB, env setup)
- [x] 10+ npm scripts for common tasks
- [x] 10 Claude Code skills
- [x] Complete documentation (README.md, AGENTS.md, scripts/README.md)
- [x] DB schema live in Supabase: 10 tables, 22 RLS policies, triggers
- [x] Seed data loaded + RLS verified per role (admin/coordinador/conductor)
- [x] Keys de Supabase rotadas y actualizadas en Vercel
- [x] Auth real con redirección por rol (login + middleware + useAuth + LogoutButton)
- [x] **Rediseño UI — Fase 0 (fundación):** migración a **shadcn/ui + Radix** (preset radix-nova, base neutral). Tokens del handoff en `app/globals.css` (verde de marca `#0F6E56` como `--primary`, sidebar oscuro `#0A0A0A`, neutros slate, sombras, radios, animaciones `fadeUp`/`pop`). Fuentes Inter + JetBrains Mono. 16 primitivos shadcn (button, card, input, table, tabs, badge, avatar, progress, dialog, sheet, dropdown-menu, sonner, etc.). `cn()` con `tailwind-merge`. Boilerplate visual viejo eliminado; páginas como placeholders (login conserva su lógica de auth). Build verde. Handoff de diseño + screenshots en `assets/screenshots/`.

- [x] **Rediseño UI — Fase 1 (shells + ruteo):** **login split** de 2 columnas (panel oscuro de marca + formulario shadcn, redirección por rol). **DashboardShell** reutilizable (frame centrado 1320px radius 14px + sidebar oscuro `#0A0A0A` con nav activo/hover + topbar + user card con logout vía dropdown). Segmentos separados por rol: `/dashboard/*` (coordinador: operación, rutas, conductores, clientes) y `/admin/*` (admin: métricas, clientes, facturación, reportes), con sub-páginas placeholder y `PageHeader` reutilizable. `homeForRole` y middleware actualizados (admin → `/admin`, protección por rol). Build verde (12 rutas).

- [x] **Rediseño UI — Fase 2 (coordinador):** 4 pantallas con datos mock — **operación en vivo** (mapa placeholder + 4 mini-stats + alertas + tabla rutas activas), **rutas** (4 cards resumen + chips de filtro interactivos + tabla 8 col), **conductores** (grid de cards con métricas), **clientes** (tabla on-time). Piezas reutilizables: `StatusBadge` (sistema de badges del handoff), `StatCard`, `RouteProgress`, `LiveMap`, `AlertsCard`, `DriverCard`, `RoutesTable`. Mock en `lib/mock/coordinator.ts`. Build verde.

- [x] **Rediseño UI — Fase 3 (admin):** 4 pantallas — **métricas** (4 KPI cards + gráfico de barras CSS + anillo conic-gradient + tabla de rentabilidad), **clientes** (gestión: 4 cards + tabla 8 col), **facturación** (4 cards + tabla con estados pagada/pendiente/vencida), **reportes** (4 cards de generación + tabla recientes). Componentes: `KpiCard`, `TonnageChart`, `ComplianceRing`, `PeriodToggle` (segmented en topbar, solo en Métricas). Mock en `lib/mock/admin.ts`. **Verificación visual** con Chrome headless (login + 5 pantallas) ✓. Build verde.

- [x] **Rediseño UI — App del conductor (mobile):** flujo completo `list → active → capture → done` en un state machine (`DriverApp`). Lista con header oscuro + progreso + cards por estado (entregada/en punto/pendiente); entrega activa con **timer en vivo** (mm:ss, arranca ~6:12 si "en punto"), dirección + Navegar/Llamar, carga; captura de **foto + firma** (placeholders con `animate-pop`) + "Recibido por", CTA habilitado solo con ambos; confirmación con check + resumen. Logout vía dropdown en avatar. Mock en `lib/mock/driver.ts`. Verificado visualmente (4 pantallas) con Chrome headless ✓.

- [x] **Light/Dark mode (Zinc) + gráficas pulidas:** sistema de tokens reescrito a escala **Zinc** (light + dark) manteniendo el verde de marca; **next-themes** (`system` por defecto, override + persistencia) con switch sol/luna en el topbar. **Sidebar claro** estilo Linear/Notion (las superficies oscuras intencionales — login, header/timer del conductor, badge mapa — pasaron a token `--panel`). Badges, StatCard, AlertsCard, LiveMap adaptados a dark. **Gráficas**: barras con línea base + pico resaltado (resto a 0.5); donut más fino con leyenda y %. Verificado en ambos modos con Chrome headless.

- [x] **Landing page (marketing oscuro):** página pública en `/` con tema oscuro fijo (colores explícitos, independiente del toggle de la app). Nav sticky con blur; hero 2 col con entrada escalonada (`fadeUp` + delays) y **mapa "EN VIVO" animado** (`LiveMapCard`: ruta SVG con dash animado, vehículo recorriéndola vía `animateMotion`, pines, chips, toast cíclico); banda de stats con **count-up** (`IntersectionObserver`, formato es-CO); sección demo con el **dashboard en LIGHT Zinc** dentro de marco de navegador (`DemoMockup`); CTA de cierre + footer. Scroll-reveal (`Reveal`) y `prefers-reduced-motion` respetado. Verificado con Chrome headless.

- [x] **Marca / iconos oficiales:** símbolo "Ruta-D" en `components/brand/BrandMark.tsx` (asta + nodo origen en `currentColor`, recorrido y destino en verde) reemplaza el placeholder de camión en sidebar, login, landing (nav+footer) y demo. **PWA**: `app/manifest.ts` (icons 192/512, standalone) + metadata de iconos en el layout (favicon svg/png, **apple-touch-icon 180**, `appleWebApp`). Assets en `public/brand/`. Arregla el icono genérico de la pantalla de inicio en iOS. Verificado con Chrome headless.

- [x] **Landing v2 (ritmo claro/oscuro):** rediseño de la landing a 8 secciones alternando fondos (nav/hero oscuro → **Producto blanco** (4 cards) → **Cómo funciona oscuro** (3 pasos) → **Plataforma `#F8FAFC`** (mockup) → **Precios oscuro** (3 planes, Operación "Más popular") → **CTA gradiente verde** → footer). Componentes nuevos: `ProductFeatures`, `HowItWorks`, `Pricing`. Se quitó la banda de stats/`CountUp`. Anclas de nav (`#producto`/`#como-funciona`/`#preview`/`#precios`). Verificado con Chrome headless.

- [x] **QA tooling (skill + subagent):** pase de QA de toda la app. `scripts/qa.mjs` (Playwright) hace login por rol (creds de prueba en `.env.local`: `QA_<ROL>_EMAIL/PASSWORD`) y recorre **todas las rutas** en desktop (1440×900) + mobile (390×844) y en **light/dark** (la landing `/` es dark-only), capturando screenshot full-page, errores de consola/JS y violaciones de accesibilidad (axe WCAG 2 A/AA, serias+críticas) → `assets/qa/<timestamp>/{report.md,results.json,*.png}` (gitignored). Skill `/qa [segmento]` (`.claude/skills/qa/`) orquesta lint+build → dev server → sweep → lectura de screenshots y veredicto PASS/WARN/FAIL. Subagente delegable `qa` (`.claude/agents/qa.md`). Script npm `npm run qa`. Tooling se instala al primer uso (`playwright`, `@axe-core/playwright`, `dotenv` como devDeps).

- [x] **Bug-fix pass (post QA-E2E audit):** corregidos 5 bugs reales sin backend. (1) **Sidebar móvil** — `DashboardShell` colapsa a un `Sheet` lateral con botón hamburguesa `md:hidden`; el `<aside>` fijo queda `hidden md:flex` (arregla las 16 pantallas coord/admin en 390px). (2) **Hidratación de `ThemeToggle`** — el `aria-label` se estabiliza hasta `mounted` (elimina los 16 errores de consola). (3) **Gate de cumplido del conductor** — "Confirmar entrega" exige también "Recibido por" no vacío. (4) **Open-redirect** — `safeRedirect()` en login rechaza `//host` y `/\host` (protocol-relative). (5) **Rol nulo/silencioso** — login y `middleware.ts` manejan el fallo del fetch de `profiles`: login cierra sesión y avisa; el middleware manda a `/login?error=perfil` (evita panel equivocado y el bucle de redirección). Build verde.

- [x] **Segment 1 — `refactor/estados-schema` (vocabulario de estados alineado al schema):** los mocks ahora usan los enums de dominio de `types/index.ts` (fuente de verdad = CHECK de `scripts/schema.sql`), para que conectar Supabase sea un cambio de fuente de datos y no un refactor. Eliminados los tipos duplicados `DeliveryStatus`/`RouteStatus`/`InvoiceStatus`. Mapeos: entrega `delivered→entregado`, `onsite→en_punto`, `pending→pendiente` (`EstadoEntrega`); ruta `en_ruta→en_curso`, `programada→pendiente`, `completada` igual (`EstadoRuta`); factura `pendiente→enviada`, `pagada`/`vencida` igual (`EstadoFactura`). **`retrasada` NO es un estado del schema** → condición derivada (`ActiveRoute.retrasada?: boolean` + helper `routeBadge()`; una ruta demorada sigue `en_curso`). Labels visibles en español natural intactas. Consumidores actualizados: `DriverApp`, `RoutesTable`, `dashboard/page`, `dashboard/rutas/page`, `admin/facturacion/page`. Verificado: build verde · lint limpio · `npm run qa` 42/42, 0 excepciones, 0 errores de consola · badges/filtros correctos.

- [x] **Segment 2 — `feat/storage-cumplidos` (infraestructura de storage para cumplidos):** solo infraestructura, sin tocar la UI todavía (eso es Phase 1). `scripts/migrations/001-storage-cumplidos.sql` crea el bucket **privado** `cumplidos` (5 MB, MIME `image/jpeg|png|webp`) con políticas RLS sobre `storage.objects`: conductor **INSERT** solo en paths de sus rutas (`route_id` parseado del path vía `storage.foldername()` y validado contra `routes.driver_id = auth.uid()`, comparando como texto para no lanzar en paths malformados), coordinador/admin **SELECT** de todo, admin **DELETE**. Paths: `{routeId}/{deliveryId}/cumplido.jpg` y `firma.png`. `lib/storage.ts` expone helpers tipados: `uploadCumplido()` (comprime a JPEG ≤1920px si hace falta), `uploadFirma()` (PNG), `getCumplidoUrl()` (signed URL 1 h, nunca pública), con `StorageError`. El SQL se corre a mano en Supabase (no ejecutado por el agente). Verificado: build verde · lint limpio · `npm run qa` 42/42, 0 excepciones, 0 errores de consola.

### 🔄 In Progress
- [ ] Conectar pantallas a datos reales de Supabase (reemplazar mocks) + captura real de cámara/firma y mapa real (landing + app del conductor + coordinador)

### 📝 Pending (Priority Order)

**WEEK 1 — Foundation**
- [x] Create DB schema with RLS policies
- [x] Seed test data (sample routes, clients, drivers)
- [x] Activate Supabase Realtime (routes, deliveries, delivery_events)
- [x] Implement real Auth — login + role-based redirects (admin/coordinador → /dashboard, conductor → /driver), protected routes via middleware, `useAuth` (user/profile/rol/signOut), reusable `LogoutButton`. Public registration removed (admin-only user creation).

**WEEK 2-3 — Driver App**
- [ ] List today's deliveries (mobile-first view)
- [ ] Mark arrival/departure with GPS
- [ ] Capture cumplido photo
- [ ] Report issues (novedades)
- [ ] Digital signature for receiver

**WEEK 4 — Coordinator Panel**
- [ ] Real-time map with truck positions
- [ ] Alerts: "Truck at point X for >60 min"
- [ ] Delivery status timeline
- [ ] Weekly malla management

**MONTH 2 — Admin Dashboard**
- [ ] KPI metrics (on-time %, tonnage, margin by client)
- [ ] Client management
- [ ] Driver management
- [ ] Reports (exportable to CSV/PDF)

**FUTURE**
- [ ] Telegram Bot for push alerts
- [ ] Google Maps optimization
- [ ] Sistran integration (if API available)
- [ ] WhatsApp Business alerts (backup)
- [ ] Payment processing (Wompi for Colombia, Stripe for others)

---

## 🚀 Quick Start for New Sessions

1. **Read this file** (you are here)
2. **Check "Project Status"** section above for current state
3. **Confirm with user** what will be worked on today
4. **Update "Project Status"** at end of session

---

## 📚 Additional Documentation

- **README.md** — Installation, setup, deployment
- **scripts/README.md** — Detailed script documentation
- **.env.local.example** — All environment variables
- **.claude/settings.json** — AI agent skills configuration
- **types/index.ts** — All TypeScript domain types
- **GitHub:** https://github.com/SebastianBuritica/despachr

---

## ✨ Summary

Despachr is a **real, solvable problem** for Colombian logistics companies. La base (schema + RLS + auth
por rol) y **toda la UI** (shadcn/ui, light/dark, iconos de marca, landing) ya están listas con datos
**mock**. La **próxima fase es la capa de datos real**: reemplazar `lib/mock/*` por queries a Supabase,
activar Realtime en el mapa del coordinador, y conectar captura de cámara/firma a Storage.

**Key principle:** Every feature should map to actual user actions:
- Driver marks "arrived" → Event created with timestamp + GPS → Alert to coordinator
- Coordinator sees truck delayed → Phone call to driver → Issue reported → Cumplido photo validates resolution

**Never add features that don't serve the three user types.**
