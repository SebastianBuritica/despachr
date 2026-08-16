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
| **Auth** | Supabase Auth — **email/password** is the only login UI today. Phone/SMS-OTP **backend** is ready & verified (Twilio Verify + `handle_new_user` for phone-only users), but the **OTP login UI is not built** → Fase 1.3b. `profiles.phone` is stored **without** the leading `+` (e.g. `573229596618`). |
| **Storage** | Supabase Storage — bucket privado `cumplidos`; **conectado** al cumplido del conductor (foto + firma, Fase 1.2) vía `lib/storage.ts` |
| **Realtime** | Supabase Realtime — **conectado** en la app del conductor (routes/deliveries, Fase 1.1/1.2); el mapa del coordinador es pendiente (Fase 2) |
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

## 🚦 v1 Scope — what "done" means

**v1 is the minimum that replaces the pilot client's WhatsApp + Excel daily operation. Nothing more.**
Work is executed **one segment = one branch = one PR**; each PR must pass `build` + `lint` + `qa`
before it's proposed. Current state and the active segment live in **STATUS.md**.

**In scope for v1:**
- **Driver app on real data** — today's own deliveries, GPS on arrival/departure, real photo +
  signature capture to Storage, **novedades** reporting, offline resilience.
- **Coordinator panel on real data** — live route status, real map, visible alerts.
- **Alerts live end-to-end** — Telegram + `pg_cron`.
- **Resilience/UX baseline** — error/loading/not-found boundaries and empty states.

**Out of scope for v1 (deferred):**
- **Admin panel depth** — KPIs, charts, billing workflow, reports, client CRUD → **v1.1**, once real
  data has accumulated (the pilot doesn't need ROA/ROE to stop using Excel).
- Multi-tenant, pricing, route optimization, Sistran/Cigo integration → **post-v1**.
- The a11y contrast backlog (35 axe warnings) → tracked, **not v1**.

### Sequence
```
Fase 1.0  — infra scaffolding (error/loading/not-found + empty states + UX hardening)   [done]
Fase 1.1  — driver: real data + GPS                                                     [done]
Fase 1.2  — driver: real photo + signature capture                                     [done]
Fase 1.3  — driver: novedades UI
Fase 1.3b — driver: OTP login UI (phone sign-in) — before offline, so 1.4 builds its
            session handling on the final auth path, not on email/password swapped later
Fase 1.4  — service worker + offline event queue
Manual    — Telegram bot + pg_cron deploy (owner runs these)
Fase 2    — coordinator: real data + map + alerts   (NOT blocked: routes/deliveries/estados/map/
            realtime/alerts touch no new columns, and coordinator RLS already grants SELECT on
            clients+deliveries+routes and SELECT/UPDATE on alerts. Only the *malla planner* waits
            on peso_kg/volumen_m3 → migration 008. Needs its OWN deliveries path — the
            entregas_de_ruta RPC is driver-only by construction, do not reuse)
```

> **Auth reality (do not overstate):** phone/SMS-OTP is **backend-only** today (verified via console);
> there is **no OTP login UI** — drivers sign in with **email/password at `/login`** until Fase 1.3b.
> `profiles.phone` has **no leading `+`** (Supabase Auth format, e.g. `573229596618`) — 1.3b's phone
> input and any `tel:` links must normalize.
>
> **Public signup must stay OFF.** "Allow new users to sign up" is a project-level Supabase setting,
> independent of the app having no signup UI. It was ON from project creation until 2026-08-16; with
> the pre-`007` `handle_new_user` that meant anyone holding the anon key (it ships in the JS bundle)
> could sign up as `admin`. It is now OFF and stays OFF: users are admin-provisioned. **Fase 1.3b
> must therefore call `signInWithOtp` with `shouldCreateUser: false`** — otherwise sign-in attempts
> from unprovisioned numbers fail confusingly instead of being rejected cleanly. Phone provider stays
> enabled (it's the OTP transport); disabling *signup* is what closes the hole, not disabling phone.

> Reusable primitives added in Fase 1.0: `components/ui/empty-state.tsx` (icon + title + message +
> action) and `components/ui/coming-soon.tsx` (wraps a `disabled` control with a "Próximamente"
> tooltip so unbuilt CTAs read as pending, not broken).

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
