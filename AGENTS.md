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
| **Frontend** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (cumplido photos) |
| **Realtime** | Supabase Realtime (map updates) |
| **Deploy** | Vercel (auto-deploy from main) |
| **Maps** | Google Maps API (future) |
| **Alerts** | Telegram Bot API (future) |

---

## 🎨 Brand Colors

```
Primary:    #0F6E56  (Dark green)
Secondary:  #1D9E75  (Light green)
Background: #F8FAFC  (Light gray)
```

### Tailwind Usage
```tsx
className="bg-primary-600 text-white"     // Primary button
className="bg-secondary-500"              // Secondary action
className="bg-background"                 // Page background
```

---

## 📁 Project Structure

### `/app` — Next.js Routes
```
app/
├── (auth)/          # Unauthenticated routes (public)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── dashboard/       # Coordinator/Admin panel (protected)
│   ├── page.tsx
│   └── layout.tsx
├── driver/          # Driver mobile view (protected)
│   ├── page.tsx
│   └── layout.tsx
├── page.tsx         # Landing page (public)
└── layout.tsx       # Root layout
```

### `/components` — React Components (13 total)

**UI Base Components** (`/components/ui/`):
- `Button.tsx` — Variants: primary, secondary, outline, ghost
- `Card.tsx` — With subcomponents: CardHeader, CardTitle, CardContent
- `Input.tsx` — With label and error validation
- `Alert.tsx` — Types: info, success, warning, error
- `Badge.tsx` — Small labels (delivery status, etc)

**Layout Components** (`/components/layout/`):
- `Header.tsx` — Responsive header with navigation
- `Sidebar.tsx` — Admin/coordinator sidebar nav

**Feature Components**:
- `components/driver/RouteList.tsx` — List of driver's today routes
- `components/driver/DeliveryCard.tsx` — Single delivery card with actions
- `components/dashboard/StatsCard.tsx` — Metric card with trend indicator
- `components/dashboard/RouteMap.tsx` — Placeholder for map integration

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
- `useAuth.ts` — Returns `{ user, loading, error }` from Supabase

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

**Last Updated:** 2026-06-28

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

### 🔄 In Progress
- [ ] Rediseño UI — Fase 1+: shells (login split, dashboard sidebar oscuro) y pantallas por rol (conductor → coordinador → admin), pixel-perfect según handoff
- [ ] Driver app: lista de entregas del día (mobile-first)

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

Despachr is a **real, solvable problem** for Colombian logistics companies. The codebase is **production-ready** in structure and conventions. The next phase is **data layer**: schema + auth. After that, the **driver app** (mobile delivery flow).

**Key principle:** Every feature should map to actual user actions:
- Driver marks "arrived" → Event created with timestamp + GPS → Alert to coordinator
- Coordinator sees truck delayed → Phone call to driver → Issue reported → Cumplido photo validates resolution

**Never add features that don't serve the three user types.**
