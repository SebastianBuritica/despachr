# Despachr — Current Status (2026-07-05)

**What it is:** A PWA for cargo-logistics management (Colombia / LATAM) that replaces the Excel + WhatsApp workflow.
**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr
**In one line:** a high-fidelity UI prototype with **real auth** and a **live database**, but the screens still render **mock data** — the next big step is wiring them to Supabase.

> Sources of truth in the repo: `AGENTS.md` (full agent context) and `QA-E2E-AUDIT.md` (detailed audit). This file is a shareable snapshot.

---

## Stack (current)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · **shadcn/ui + Radix** · next-themes (light/dark) · Supabase (Postgres + Auth + Realtime + Storage) · Vercel (auto-deploy from `main`).

---

## ✅ What actually works today

- **Real role-based auth.** Login (Supabase Auth) + middleware that protects routes and redirects by role: admin → `/admin`, coordinator → `/dashboard`, driver → `/driver`. No public sign-up (admin creates users). Verified in production.
- **Live database.** 10 tables, 22 RLS policies, triggers, seed data loaded. RLS verified per role: a driver sees only their own data; the coordinator sees everything **except** financials; the admin sees all. Driver pay and margin are isolated in an admin-only table (`delivery_financials`).
- **Realtime enabled** on the map tables (routes, deliveries, delivery_events) — at the DB level.
- **Full, polished UI** (every screen, on mock data):
  - Marketing landing (v2, 8 sections, animated "LIVE" map)
  - Two-column split login with brand panel
  - **Coordinator** ×4: live operations, routes, drivers, clients
  - **Admin** ×4: metrics (KPIs + charts), clients, billing, reports
  - **Driver** (mobile): full flow list → active delivery (timer) → capture photo/signature → confirmation
  - **Light/dark mode** across the app · official brand icons · installable PWA (iOS/Android)
- **In-house QA tooling:** Playwright sweep of 42 screens (desktop + mobile, light + dark) capturing screenshots + console/JS errors + accessibility. Last QA run: **0 JS exceptions, 0 console errors, build green, lint clean.**
- **5 real bugs fixed** in the last pass (mobile sidebar, theme-toggle hydration, driver confirm gate, open-redirect, null-role handling).

---

## ⚠️ What is still a prototype (the honest gap)

Per the QA audit itself: **"a high-fidelity UI prototype, not a working product yet."**

- **0 of 9** coordinator/admin screens read from or write to Supabase — they are 100% mock (`lib/mock/*`).
- **~12 primary action buttons** don't do anything yet (no onClick/modal).
- In the driver app, **camera / signature / GPS are simulated** (visual placeholders).
- The **map** is a styled placeholder (no real map yet).
- Landing **pricing** is mock.
- Accessibility backlog: 35 color-contrast warnings (P2).

---

## ▶️ Next phase (in order)

1. **Wire screens to real Supabase data** — replace `lib/mock/*` with queries (starting with coordinator and driver).
2. **Real proof-of-delivery capture** — camera + signature → Supabase Storage.
3. **Real map** with truck positions + Realtime subscriptions in the coordinator panel.
4. **Real GPS** on driver arrivals/departures.
5. Real pricing on the landing.

---

## Infra / notes

- `main` in sync with origin · auto-deploy to Vercel on every push · Supabase keys (new publishable/secret) set across all 3 environments.
- Test users: `admin@ / coord@ / driver@ despachr.test` (QA credentials live in a git-ignored file).
- Verified for this snapshot: `npm run build` green · production returns HTTP 200 · `/dashboard` (logged out) → 307 redirect to `/login`.
