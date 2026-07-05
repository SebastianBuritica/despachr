# Despachr — End-to-End QA Audit

**Date:** 2026-07-04
**Build:** `main` @ commit `9ada140` · Next.js 16.2.9 · React 19
**Method:** Automated Playwright sweep (42 screens, all roles, desktop+mobile, light+dark, axe WCAG 2 A/AA) + full code audit of every interactive element across the 4 app areas + manual visual inspection of screenshots.
**Environment:** local dev server, real Supabase seed logins (`admin@`/`coord@`/`driver@despachr.test`).

---

## Update — fixes applied (2026-07-05, PR #15)

A first bug-fix pass resolved the **5 genuinely-broken items** (no backend needed). Feature gaps (dead buttons, faked capture, Supabase wiring) remain open by design and are tracked in `AGENTS.md`.

| Finding | Status |
|---------|--------|
| P0 #1 — Dashboard shell broken on mobile | ✅ **Resuelto** — sidebar colapsa a un `Sheet` (hamburguesa `md:hidden`) |
| P0 #2 — ThemeToggle hydration mismatch (16 console errors) | ✅ **Resuelto** — `aria-label` estabilizado hasta `mounted`; re-QA = **0 console errors** |
| P0 #4 — Driver confirm gate ignores receiver name | ✅ **Resuelto** — "Confirmar entrega" exige "Recibido por" no vacío |
| P1 sec — Open redirect (`//host`) | ✅ **Resuelto** — `safeRedirect()` rechaza `//host` y `/\host` |
| P1 sec — Silent role fallback | ✅ **Resuelto** — login cierra sesión + avisa; middleware → `/login?error=perfil` |
| P0 #3 (dead buttons), P0 #4 (camera/signature/GPS), P1 infra, P2 a11y, Supabase wiring | ⏳ **Abierto** — fuera del alcance de este pase |

Re-verified with `npm run qa` (42 screens): **0 JS exceptions · 0 console errors** (was 16) · 0 navigation failures · build green · lint clean. Remaining warnings are the pre-existing a11y backlog (P2).

---

## Verdict

**⚠ The app is a high-fidelity UI prototype, not a working product yet.**

The structure, design system, and navigation are solid and the build is green (0 JS exceptions, 0 navigation failures across 42 screens). But **almost nothing is functional**: the coordinator and admin panels are 100% static mock data with zero Supabase reads/writes, most primary action buttons are dead, the driver's camera/signature/GPS are fakes, and the shared dashboard shell is broken on mobile.

| Signal | Result |
|--------|--------|
| Screens captured | 42 / 42 |
| JS exceptions | **0** ✅ |
| Navigation failures | **0** ✅ |
| Console errors | ~~**16**~~ → **0** ✅ (hydration bug fixed, PR #15) |
| A11y serious/critical | **35** (all color-contrast) |
| Pages wired to Supabase | **0 of 9** (login/middleware only) |
| Dead primary buttons found | **~12** |

Screenshots + machine report: `assets/qa/2026-07-05T02-08-21/` (gitignored). Re-run anytime with `npm run qa`.

---

## P0 — Blockers (fix before any real use)

### 1. Dashboard shell is broken on mobile (all 16 coordinator + admin screens) 🔴 *verified visually* — ✅ RESUELTO (PR #15)
The `DashboardShell` sidebar is a fixed-width `<aside>` with no responsive collapse, so at 390px it eats ~60% of the viewport and shoves content off-screen — headings clipped ("Facturación"→"Facturac", "Operación en vivo"→"Operació"), stat cards overlap (Pendiente/Vencida collide), tables cut off.
- **Evidence:** `components/layout/DashboardShell.tsx` (the `<aside>` has no `hidden`/drawer behavior at `md:` breakpoints). Visible in `admin_facturacion_mobile_*.png`, `dashboard_operacion-en-vivo_mobile_*.png`, and every other coordinator/admin mobile shot.
- **Fix:** collapse the sidebar into a Sheet/drawer below `md`, as the design handoff intends. (Driver app is unaffected — it has its own mobile layout and renders correctly.)

### 2. ThemeToggle hydration mismatch on every authenticated page 🔴 *verified — root cause confirmed* — ✅ RESUELTO (PR #15)
The **icon** is gated on `mounted` but the **aria-label** is not, so it renders `"Cambiar a modo oscuro"` (server) vs `"Cambiar a modo claro"` (client), producing a React hydration error on all dark-mode dashboard/admin pages (the 16 console errors).
- **Evidence:** [`components/theme/ThemeToggle.tsx:19`](components/theme/ThemeToggle.tsx#L19) (label uses `isDark`) vs line 23 (icon guarded by `mounted`).
- **Fix:** gate the label on `mounted` too (stable label until mounted), or `suppressHydrationWarning`.

### 3. Dead primary buttons across admin + coordinator 🔴
The main call-to-action on almost every management screen does nothing — no `onClick`, no `href`, no modal:
- `app/admin/clientes/page.tsx:23` — **"Nuevo cliente"** no-op
- `app/admin/facturacion/page.tsx:23` — **"Generar factura"** no-op
- `app/admin/reportes/page.tsx:60` — **"Generar"** (×4 report cards) no-op
- `app/admin/reportes/page.tsx:92` — **"Descargar"** (recent reports) no-op
- `app/dashboard/rutas/page.tsx:20` — **"Nueva ruta"** no-op
- `app/dashboard/conductores/page.tsx:16` — **"Agregar conductor"** no-op
- `components/layout/DashboardShell.tsx:158` — **search bar** is a static `<div>`, not an input
- `components/layout/DashboardShell.tsx:163` — **notification bell** no handler; badge hardcoded "3"

### 4. Driver: proof-of-delivery flow is faked 🔴
The cumplido capture — the single most important driver action — records nothing real:
- `components/driver/DriverApp.tsx:299,303` — **"Navegar"** and **"Llamar"** buttons have no handler (no `tel:`/maps link).
- `components/driver/DriverApp.tsx:385-414` — **photo** capture is a toggle showing a hardcoded `FOTO_CARGA_01.jpg`; no `<input type=file>` / camera, no upload.
- `components/driver/DriverApp.tsx:420-438` — **signature** is a toggle showing a hardcoded "Andrés R."; no signature pad.
- `components/driver/DriverApp.tsx:363` — confirm button gates on `photo && signed` but **not** on the "Recibido por" name, so it enables with an empty receiver. — ✅ RESUELTO (PR #15): ahora exige `receiver.trim()`.
- Nothing persists: marking delivered only updates local React state (`:74`), lost on refresh.

---

## P1 — Security & robustness (auth) *(open-redirect verified)*

- **Open redirect** 🟠 *verified* — ✅ **RESUELTO (PR #15)** — [`app/(auth)/login/page.tsx:61`](app/(auth)/login/page.tsx#L61) accepts `?redirect=` validated only by `startsWith('/')`, so `//evil.com` (protocol-relative) passes and `router.replace` navigates off-site. Same pattern in `middleware.ts:51`. **Fix aplicado:** `safeRedirect()` rechaza `//host` y `/\host`.
- **Silent role fallback** 🟠 — ✅ **RESUELTO (PR #15)** — `login/page.tsx:59` and `middleware.ts:59` fetch the profile with `.single()` and no error handling; on failure `role` is `null` and the user is sent to `/dashboard` regardless of actual role. A user in `auth.users` but missing from `profiles` → unhandled throw / wrong panel. **Fix aplicado:** login cierra sesión y avisa; middleware redirige a `/login?error=perfil` (sin bucle).
- **No password reset** 🟠 — `login/page.tsx:99` "¿Olvidaste tu contraseña?" is `href="#"`; no reset flow exists. Locked-out users need admin intervention.
- **Logout has no error handling** 🟡 — `DashboardShell.tsx:184` / `LogoutButton` call `signOut()` + redirect with no try/catch; a failed signOut redirects to login while the session persists.
- **No rate limiting / lockout feedback** 🟡 on login attempts.

---

## P1 — Missing infrastructure (whole app)

- **No `error.tsx`** anywhere → unhandled errors show the raw Next.js error page.
- **No `loading.tsx`** → no skeletons for when real data fetching lands.
- **No `not-found.tsx`** → default 404, off-brand.
- **No client-side form validation** on login (only `required`); `Input` supports `aria-invalid` but it's unused.
- **No empty states** — pages assume data exists; a day with zero routes renders blank tables with no guidance.
- **PWA is cosmetic** — `app/manifest.ts` + icons exist (installable) but there's **no service worker**, so zero offline support despite the "works offline" claim in AGENTS.md. Most critical for the driver app (GPS/capture in low-signal areas).

---

## P2 — Accessibility (35 serious/critical, all contrast)

All violations are `color-contrast` (WCAG 2 AA). Worst offenders:
- Landing `/` dark: 13 (desktop) / 12 (mobile) — muted grey text on near-black.
- `/admin` light: 9; several `/dashboard/*` light: 5–7 each.
- `/login` dark, `/driver`: 1 each.

**Fix:** bump muted-foreground tokens to meet 4.5:1 (large text 3:1), especially the dark-mode landing captions and admin secondary text.

---

## Missing functionality by role (the build backlog)

Everything below is *absent or faked*, mapped to the AGENTS.md product spec.

### Driver
- GPS capture on arrival/departure (schema has `latitude`/`longitude`, never written) — `DriverApp.tsx` has no `navigator.geolocation`.
- Real photo → Supabase Storage upload; real signature pad → persisted.
- **Novedades** (issue reporting: rechazo/faltante/dañado/cliente ausente) — no UI at all.
- "Only today's own deliveries" — loads a hardcoded mock array, no date/driver filter, `useAuth()` result unused for scoping.
- Real-time status sync (coordinator changes don't reach the driver).

### Coordinator
- **Real map** — `components/dashboard/LiveMap.tsx` is a static SVG placeholder (its own comment says "En producción se integra un mapa real"). No live truck positions.
- **Alert escalation** — `AlertsCard.tsx` alerts are read-only labels; no "Llamar"/"Escalar"/acknowledge. The core "truck stopped >60 min → escalate" loop is not met.
- **Route detail drill-down** — `RoutesTable.tsx` rows have no click/detail; no delivery timeline, no cumplido viewer.
- **"Malla" weekly planner** — entire feature missing (no `/dashboard/malla`).
- Hardcoded, non-updating live data: `dashboard/page.tsx:24` date is the static string "Lunes 15 de enero · 11:24 a. m."; stat counts and the "3" notification badge are hardcoded.

### Admin
- **Client CRUD** — no add/edit/delete; table is read-only mock.
- **Invoice workflow** — no creation, no pagada/pendiente/vencida transitions, no AR aging / DSO.
- **Report generation + export** — no params, no `/api/reports`, no file download; "Generar"/"Descargar" are decorative.
- **PeriodToggle (Hoy/Semana/Mes) is not wired** — local state in the topbar that no page reads, so KPIs/chart/ring never change.
- Charts (`TonnageChart`, `ComplianceRing`) are CSS renderings of hardcoded numbers.

### Systemic
**0 of 9 dashboard/admin/driver pages issue a single `supabase.from()` query or Realtime subscription.** All data comes from `lib/mock/{admin,coordinator,driver}.ts`. This is the #1 gap — it's tracked as the "In Progress" item in AGENTS.md and everything above depends on it.

---

## What already works ✅

- Auth: real Supabase login, role-based redirect, middleware route protection (all 3 roles logged in cleanly for this audit).
- Logout (dropdown → `signOut()` → `/login`).
- Theme toggle functionally switches + persists (only the aria-label hydration is buggy).
- Navigation between all segments.
- Route filter chips (work locally; just don't fetch).
- Driver flow *as a demo*: `list → active → capture → done` state machine with live timer renders correctly on mobile.
- Landing + login are responsive and render fully in all themes.
- Build is green; TypeScript strict; 0 runtime exceptions across 42 screens.

---

## Recommended order of work

1. **Fix the 4 P0 bugs** — mobile sidebar (Sheet), ThemeToggle label guard, wire (or disable-with-tooltip) dead buttons, gate driver confirm on receiver name. Small, high-impact, no backend needed.
2. **Harden auth** — redirect allowlist, profile-fetch error handling, password-reset flow. Security + lockout risk.
3. **Add infra scaffolding** — `error.tsx` / `loading.tsx` / `not-found.tsx`, form validation, empty states.
4. **Connect Supabase** (the big one) — replace `lib/mock/*` with queries + Realtime, per role. Unlocks nearly every "missing functionality" item.
5. **Build the real capture + map** — camera/signature/GPS + Storage for the driver; Google Maps/Mapbox + live positions for the coordinator.
6. **A11y pass** — contrast tokens.

---

*Generated from `npm run qa` (Playwright + axe) plus a 4-area code audit. Every finding cites file:line; P0/security items were re-verified by hand. Re-run the automated portion with `npm run qa` (or `npm run qa driver`, etc.).*
