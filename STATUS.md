# Despachr — Current Status (2026-07-25)

**What it is:** A PWA for cargo-logistics management (Colombia / LATAM) that replaces the Excel + WhatsApp workflow.
**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr
**In one line:** **Fase 0 + Fase 1.0 complete; Fase 1.1 (driver on real data + GPS) done pending PR** — the **driver app is now the first screen reading and writing real Supabase data**: a phone-authed driver sees only their own deliveries for today, marks `Llegué`/`Salí` (GPS events → DB triggers derive state), and the mock `lib/mock/driver.ts` is deleted. Coordinator + admin screens are still on mock data. Next: Fase 1.2 (real photo + signature capture).

> **Doc map:** `AGENTS.md` = durable reference (product/stack/conventions, auto-loaded) · **this file (STATUS.md)** = living state + next steps (overwrite each session) · `CHANGELOG.md` = append-only history · `QA-E2E-AUDIT-2026-07-24.md` = latest audit.

---

## Stack (current)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · **shadcn/ui + Radix** · next-themes (light/dark) · Supabase (Postgres + Auth + Realtime + Storage) · Vercel (auto-deploy from `main`).

---

## ✅ What actually works today

- **Real role-based auth.** Login (Supabase Auth, **email/password**) at `/login` + middleware that protects routes and redirects by role: admin → `/admin`, coordinator → `/dashboard`, driver → `/driver`. No public sign-up (admin creates users).
- **Phone-auth (SMS OTP) — backend live, UI not built yet.** The *backend* is configured and verified: Twilio Verify set up, `handle_new_user` creates profiles for phone-only users (email nullable), and `signInWithOtp`/`verifyOtp` confirmed working via the Supabase console. **But there is no OTP login screen in the app** — the repo has no `signInWithOtp`/`verifyOtp` call, and `/login` offers only email/password. So **drivers currently sign in with email/password at `/login`**; the phone-OTP login UI is **Fase 1.3b** (after novedades, before the service worker). *(Do not read this as "drivers log in by OTP today" — that's the gap 1.3b closes.)*
- **Live database — 11 tables**, 24 RLS policies, triggers, seed data. RLS verified per role: a driver sees only their own data; the coordinator sees everything **except** financials; the admin sees all. Driver pay/margin isolated in admin-only tables (`delivery_financials`, `client_invoices`). **Migrations `001`–`004` executed in production** (`004` = `deliveries.telefono_receptor` for the "Llamar" button).
- **Driver app on REAL data (Fase 1.1).** The phone-authed driver loads their own route for today and its deliveries from Supabase (`lib/queries/driver.ts`), marks **`Llegué`/`Salí`** which insert `delivery_events` (`lib/queries/events.ts`) — the DB triggers derive `hora_llegada_punto`/`en_punto` and `tiempo_en_punto_minutos` (app re-reads, never recomputes). **GPS** is captured on those events (`lib/geo.ts`) and **never blocks**: on denial/timeout the event is saved without coords + a subtle notice. The visual timer **seeds from `hora_llegada_punto`** so a refresh doesn't reset it. `lib/mock/driver.ts` is **deleted**. Camera/signature stay simulated (Fase 1.2).
- **Storage backend ready** — private `cumplidos` bucket (5 MB, jpeg/png/webp) with RLS (driver INSERT own routes, coord/admin SELECT, admin DELETE) + typed helpers in `lib/storage.ts` (`uploadCumplido`, `uploadFirma`, `getCumplidoUrl`). Not yet wired into the UI.
- **60-min alert backend ready** — `alerts` table + Deno edge function `check-tiempo-en-punto` (detects a driver >60 min at a point → in-app alert + Telegram). Code merged; **deploy + scheduling are pending manual steps** (see below).
- **Realtime enabled** on the map tables (routes, deliveries, delivery_events) — at the DB level.
- **Full, polished UI**: marketing landing (v2), split login, **Coordinator ×4** + **Admin ×4** (still mock data), **Driver** (mobile flow list → active → capture → done, now on **real data**), light/dark, brand icons, installable PWA.
- **Mock data already speaks the schema vocabulary** (`EstadoEntrega`/`EstadoRuta`/`EstadoFactura`) — so wiring Supabase is a data-source swap, not a refactor.
- **In-house QA tooling** — Playwright sweep of 42 screens (desktop + mobile, light + dark) + axe. Last run: **0 JS exceptions, 0 console errors, build green, lint clean**.

### This session's shipped work (Fase 0, all merged)

| PR | Segment / work |
|----|----------------|
| #15 | Bug-fix pass — 5 real bugs (mobile sidebar drawer, theme-toggle hydration, driver confirm gate, open-redirect, null-role handling) |
| #16 | Segment 1 — mock state vocabulary aligned to schema enums (`retrasada` derived; invoice `pendiente`→`enviada`) |
| #17 | Segment 2 — storage bucket + `lib/storage.ts` helpers |
| #18 | Segment 3 — `alerts` table + 60-min edge function |
| #19 | Segment 4 — driver phone-auth **backend** (fix `handle_new_user()`; `profiles.email` nullable) — **backend only, no login UI** (that's Fase 1.3b) |
| #20 | Segment 5 — assets cleanup + docs sync (this file, README, AGENTS) |

---

## ⚠️ What is still a prototype (the honest gap)

- **Coordinator + admin screens** still read from mock data (`lib/mock/{coordinator,admin}.ts`) — the **driver app is now the exception** (real Supabase). Coordinator/admin wiring is Fase 2 / v1.1.
- **~12 primary action buttons** are no-ops → disabled behind a "Próximamente" tooltip since Fase 1.0.
- In the driver app, **camera / signature are still simulated** (Fase 1.2) — Storage backend (`lib/storage.ts`) is ready but not wired. **GPS is now real** (captured on `Llegué`/`Salí`).
- The **map** is a styled placeholder (no real map yet).
- Landing **pricing** is mock.
- Accessibility backlog: 35 serious axe warnings (color-contrast + keyboard-scrollable regions) — P2.

---

## ▶️ Next phase — what the next agent should do

> **v1 scope + the full Fase 1.x → Fase 2 sequence now live in AGENTS.md** (durable). This section
> tracks the current step.

**Done — Fase 1.0 (PR #23, merged):** error/loading/not-found boundaries, empty states, login
hardening, `signOut` try/catch, dead CTAs disabled behind "Próximamente", driver quick wins.

**Done — Fase 1.1 (PR #24, merged):** DriverApp on real Supabase data (`lib/queries/driver.ts` +
`events.ts`), `Llegué`/`Salí` GPS events (`lib/geo.ts`), timer seeded from `hora_llegada_punto`, mock
deleted. Needed **migration `004-telefono-receptor.sql`** (run in prod). Camera/signature stay simulated.

**Next — continue the driver vertical, then coordinator:**

1. **Fase 1.2 — driver real capture:** camera + signature → Storage via `lib/storage.ts`; emit the `cumplido` event; persist `foto_cumplido_url`. (Replaces the simulated photo/signature in `DriverApp`.)
2. **Fase 1.3 — novedades UI** (issue reporting).
3. **Fase 1.3b — driver OTP login UI** (phone sign-in): `signInWithOtp`/`verifyOtp` screen so phone-only drivers can authenticate. Sequenced here **on purpose** — Fase 1.4's offline session handling must be built on the *final* auth path, not on email/password that then gets swapped for OTP (would be double work). Note: `profiles.phone` stores the number **without** the leading `+` (Supabase Auth format, e.g. `573229596618`) → phone inputs and `tel:` links must normalize.
4. **Fase 1.4 — service worker + offline event queue.**
5. **Fase 2 — Coordinator** — real routes/deliveries + **real map** + Realtime + surface the `alerts` table (acknowledge/resolve). **Blocked on migration `005` (`peso_kg`/`volumen_m3`)** — queued, pending pilot-client requirements.
6. **v1.1 — Admin** depth (KPIs, client CRUD, invoice workflow) — out of v1 scope.

**Two pending manual deploys (code already merged in #18 — the alert system isn't *live* until these are done):**
- **Telegram bot** — create via BotFather, then `supabase secrets set TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=…` + `supabase functions deploy check-tiempo-en-punto`.
- **pg_cron scheduling** — enable `pg_cron`/`pg_net`, then schedule the function every 5 min. Exact steps: `supabase/functions/check-tiempo-en-punto/README.md`.

---

## Infra / notes

- `main` in sync with origin · auto-deploy to Vercel on every push.
- Supabase env keys set across all 3 Vercel environments (incl. `NEXT_PUBLIC_SUPABASE_URL` in **Preview** — added this session; previews were failing without it).
- Migrations are **hand-run, repo-tracked SQL** in `scripts/migrations/` (`001`–`004`) — the project does **not** use Supabase CLI versioned migrations. Base schema: `scripts/schema.sql`. Manual dev-test helper (not a migration): `scripts/testing/fase-1.1-driver-datos-reales.sql`.
- Test users: `admin@ / coord@ / driver@ despachr.test` (QA credentials in a git-ignored file).
- `/assets` is gitignored (design handoffs + QA artifacts live outside the repo); brand kit is versioned in `/public/brand`.
- Known/accepted deps: 2 moderate `postcss`-via-`next` audit findings — only fix is a Next 16→9 major downgrade, so deferred until Next patches its bundled postcss.
