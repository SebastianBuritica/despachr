# Despachr — Current Status (2026-07-24)

**What it is:** A PWA for cargo-logistics management (Colombia / LATAM) that replaces the Excel + WhatsApp workflow.
**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr
**In one line:** **Fase 0 (foundation) is complete** — real auth (incl. driver phone OTP), a live 11-table DB, and the storage + alerts backends are all in place; the screens still render **mock data**, so the next big step is **Fase 1: wiring them to Supabase** (starting with the driver app).

> Sources of truth in the repo: `AGENTS.md` (full agent context) and `QA-E2E-AUDIT-2026-07-24.md` (latest audit). This file is a shareable snapshot.

---

## Stack (current)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · **shadcn/ui + Radix** · next-themes (light/dark) · Supabase (Postgres + Auth + Realtime + Storage) · Vercel (auto-deploy from `main`).

---

## ✅ What actually works today

- **Real role-based auth.** Login (Supabase Auth) + middleware that protects routes and redirects by role: admin → `/admin`, coordinator → `/dashboard`, driver → `/driver`. No public sign-up (admin creates users). **Drivers can now log in by SMS OTP** (Supabase Phone Auth + Twilio Verify). Verified in production.
- **Live database — 11 tables**, 24 RLS policies, triggers, seed data. RLS verified per role: a driver sees only their own data; the coordinator sees everything **except** financials; the admin sees all. Driver pay/margin isolated in admin-only tables (`delivery_financials`, `client_invoices`). **Migrations `001`–`003` executed in production.**
- **Storage backend ready** — private `cumplidos` bucket (5 MB, jpeg/png/webp) with RLS (driver INSERT own routes, coord/admin SELECT, admin DELETE) + typed helpers in `lib/storage.ts` (`uploadCumplido`, `uploadFirma`, `getCumplidoUrl`). Not yet wired into the UI.
- **60-min alert backend ready** — `alerts` table + Deno edge function `check-tiempo-en-punto` (detects a driver >60 min at a point → in-app alert + Telegram). Code merged; **deploy + scheduling are pending manual steps** (see below).
- **Realtime enabled** on the map tables (routes, deliveries, delivery_events) — at the DB level.
- **Full, polished UI** (every screen, on mock data): marketing landing (v2), split login, **Coordinator ×4**, **Admin ×4**, **Driver** (mobile flow list → active → capture → done), light/dark, brand icons, installable PWA.
- **Mock data already speaks the schema vocabulary** (`EstadoEntrega`/`EstadoRuta`/`EstadoFactura`) — so wiring Supabase is a data-source swap, not a refactor.
- **In-house QA tooling** — Playwright sweep of 42 screens (desktop + mobile, light + dark) + axe. Last run: **0 JS exceptions, 0 console errors, build green, lint clean**.

### This session's shipped work (Fase 0, all merged)

| PR | Segment / work |
|----|----------------|
| #15 | Bug-fix pass — 5 real bugs (mobile sidebar drawer, theme-toggle hydration, driver confirm gate, open-redirect, null-role handling) |
| #16 | Segment 1 — mock state vocabulary aligned to schema enums (`retrasada` derived; invoice `pendiente`→`enviada`) |
| #17 | Segment 2 — storage bucket + `lib/storage.ts` helpers |
| #18 | Segment 3 — `alerts` table + 60-min edge function |
| #19 | Segment 4 — driver phone OTP login (fix `handle_new_user()`; `profiles.email` nullable) |
| #20 | Segment 5 — assets cleanup + docs sync (this file, README, AGENTS) |

---

## ⚠️ What is still a prototype (the honest gap)

- **0 of 9** coordinator/admin screens read from or write to Supabase — still 100% mock (`lib/mock/*`).
- **~12 primary action buttons** are no-ops (no onClick/modal).
- In the driver app, **camera / signature / GPS are simulated** (visual placeholders) — the *backend* to persist them (Storage) is ready, but not wired.
- The **map** is a styled placeholder (no real map yet).
- Landing **pricing** is mock.
- Accessibility backlog: 35 serious axe warnings (color-contrast + keyboard-scrollable regions) — P2.

---

## ▶️ Next phase — what the next agent should do

**Fase 1 — wire the screens to real Supabase data** (replace `lib/mock/*`), in order:

1. **Driver app first** — load today's own deliveries for the logged-in driver; wire real **camera + signature → Storage** via `lib/storage.ts`; emit `llegada_punto`/`salida_punto`/`cumplido` events (which drive the DB triggers and the 60-min alert timer); capture GPS on arrival/departure.
2. **Coordinator** — real routes/deliveries + **real map** with truck positions + Realtime subscriptions; surface the `alerts` table in the alerts card (acknowledge/resolve).
3. **Admin** — real KPIs, client CRUD, invoice workflow.

**Two pending manual deploys (code already merged in #18 — the alert system isn't *live* until these are done):**
- **Telegram bot** — create via BotFather, then `supabase secrets set TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=…` + `supabase functions deploy check-tiempo-en-punto`.
- **pg_cron scheduling** — enable `pg_cron`/`pg_net`, then schedule the function every 5 min. Exact steps: `supabase/functions/check-tiempo-en-punto/README.md`.

---

## Infra / notes

- `main` in sync with origin · auto-deploy to Vercel on every push.
- Supabase env keys set across all 3 Vercel environments (incl. `NEXT_PUBLIC_SUPABASE_URL` in **Preview** — added this session; previews were failing without it).
- Migrations are **hand-run, repo-tracked SQL** in `scripts/migrations/` (`001`–`003`) — the project does **not** use Supabase CLI versioned migrations. Base schema: `scripts/schema.sql`.
- Test users: `admin@ / coord@ / driver@ despachr.test` (QA credentials in a git-ignored file).
- `/assets` is gitignored (design handoffs + QA artifacts live outside the repo); brand kit is versioned in `/public/brand`.
- Known/accepted deps: 2 moderate `postcss`-via-`next` audit findings — only fix is a Next 16→9 major downgrade, so deferred until Next patches its bundled postcss.
