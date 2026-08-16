# Despachr — Current Status (2026-08-06)

**What it is:** A PWA for cargo-logistics management (Colombia / LATAM) that replaces the Excel + WhatsApp workflow.
**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr
**In one line:** **Fase 0 + 1.0 + 1.1 + 1.2 complete (Fase 1.2 merged — PR #27)** — the **driver app runs the full cumplido on live Supabase data**: real photo (device camera) + optional canvas signature upload to Storage, receiver name persisted, `Llegué`/`Salí` GPS events, realtime sync. The done screen's evidence claim is now truthful. Coordinator + admin screens are still on mock data. Next: Fase 1.3 (novedades UI).

> **Doc map:** `AGENTS.md` = durable reference (product/stack/conventions, auto-loaded) · **this file (STATUS.md)** = living state + next steps (overwrite each session) · `CHANGELOG.md` = append-only history · `QA-E2E-AUDIT.md` = latest audit.

---

## Stack (current)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · **shadcn/ui + Radix** · next-themes (light/dark) · Supabase (Postgres + Auth + Realtime + Storage) · Vercel (auto-deploy from `main`).

---

## ✅ What actually works today

- **Real role-based auth.** Login (Supabase Auth, **email/password**) at `/login` + middleware that protects routes and redirects by role: admin → `/admin`, coordinator → `/dashboard`, driver → `/driver`. No public sign-up (admin creates users).
- **Phone-auth (SMS OTP) — backend live, UI not built yet.** The *backend* is configured and verified: Twilio Verify set up, `handle_new_user` creates profiles for phone-only users (email nullable), and `signInWithOtp`/`verifyOtp` confirmed working via the Supabase console. **But there is no OTP login screen in the app** — the repo has no `signInWithOtp`/`verifyOtp` call, and `/login` offers only email/password. So **drivers currently sign in with email/password at `/login`**; the phone-OTP login UI is **Fase 1.3b** (after novedades, before the service worker). *(Do not read this as "drivers log in by OTP today" — that's the gap 1.3b closes.)*
- **Live database — 11 tables**, 24 RLS policies, triggers, seed data. RLS verified per role **on reads**: a driver sees only their own data; the coordinator sees everything **except** financials; the admin sees all. Driver pay/margin isolated in admin-only tables (`delivery_financials`, `client_invoices`). ⚠️ **Writes were never verified the same way, and that's where the holes were** — RLS is row-level, so `profiles_update_self` let any authenticated user write their own `role` (escalation to admin) and `deliveries_driver_update` let a driver write `valor_flete`. Migration `007` closes both with triggers. **Migrations `001`–`006` executed in production** (`004` = `deliveries.telefono_receptor`; `005` = the `entregas_de_ruta` RPC + hardened `get_my_role()` `search_path`; `006` = `deliveries.recibido_por`/`firma_url` + RPC returns the evidence columns). **`007` is merged but NOT yet run in prod — the holes stay open until you run it.**
- **Driver app on REAL data (Fase 1.1 + fixes).** The phone-authed driver loads their own route for today and its deliveries from Supabase (`lib/queries/driver.ts`), marks **`Llegué`/`Salí`** which insert `delivery_events` (`lib/queries/events.ts`) — the DB triggers derive `hora_llegada_punto`/`en_punto` and `tiempo_en_punto_minutos` (app re-reads, never recomputes). **GPS** is captured on those events (`lib/geo.ts`) and **never blocks**: on denial/timeout the event is saved without coords + a subtle notice. The visual timer **seeds from `hora_llegada_punto`** so a refresh doesn't reset it. **Client name comes via the `entregas_de_ruta` SECURITY DEFINER RPC** (drivers can't read `clients` by RLS, and a plain grant would leak `tarifa_flete`; the RPC returns only safe columns, ownership-checked — `LEFT join` so an orphaned `client_id` never drops the delivery). **Realtime**: a channel scoped to this driver re-fetches on changes to their `routes`/`deliveries`, so a route assigned mid-session appears without a manual refresh (with a subtle "sin conexión en vivo" indicator + auto-reconnect on channel error). `lib/mock/driver.ts` is **deleted**.
- **Real cumplido capture (Fase 1.2).** Photo via the device camera (`<input capture="environment">`, rear camera on mobile / file picker on desktop) → compressed by `uploadCumplido` (canvas, ≤1920px/JPEG) → `deliveries.foto_cumplido_url`. **Optional** canvas signature pad (`SignaturePad`, Pointer Events, white-paper/black-ink PNG) → `uploadFirma` → `firma_url` (confirmation never blocks on a missing signature). Receiver name → `recibido_por`. **Upload is resilient**: on failure the capture is kept and retry reuses already-uploaded parts; `estado='entregado'` is the *last* step, so a failed upload leaves the delivery `en_punto`. The done screen's **evidence line is now honest** (reflects what was actually stored, not a hardcoded "✓").
- **Storage backend ready** — private `cumplidos` bucket (5 MB, jpeg/png/webp) with RLS (driver INSERT own routes, coord/admin SELECT, admin DELETE) + typed helpers in `lib/storage.ts` (`uploadCumplido`, `uploadFirma`, `getCumplidoUrl`). **Wired into the driver capture flow (Fase 1.2 — see above).**
- **60-min alert backend ready** — `alerts` table + Deno edge function `check-tiempo-en-punto` (detects a driver >60 min at a point → in-app alert + Telegram). Code merged; **deploy + scheduling are pending manual steps** (see below).
- **Realtime enabled** on the map tables (routes, deliveries, delivery_events) — at the DB level.
- **Full, polished UI**: marketing landing (v2), split login, **Coordinator ×4** + **Admin ×4** (still mock data), **Driver** (mobile flow list → active → capture → done, now on **real data**), light/dark, brand icons, installable PWA.
- **Mock data already speaks the schema vocabulary** (`EstadoEntrega`/`EstadoRuta`/`EstadoFactura`) — so wiring Supabase is a data-source swap, not a refactor.
- **In-house QA tooling** — Playwright sweep of 42 screens (desktop + mobile, light + dark) + axe. Last run (2026-08-06, `QA-E2E-AUDIT.md`): **42/42 captured · 0 JS exceptions · 0 console errors · 0 nav failures · build green · lint clean** (30 axe color-contrast warnings = P2 backlog).

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
- Driver **camera / signature / GPS are now real** and persisted (Fase 1.2 wired `lib/storage.ts`). Remaining driver gap: **novedades** reporting (Fase 1.3) and the **OTP login UI** (Fase 1.3b).
- The **map** is a styled placeholder (no real map yet).
- Landing **pricing** is mock.
- **Known minor bugs** (from the 2026-08-06 audit, non-blocking): coordinator "Completadas" home stat is hardcoded `"1"` (`app/dashboard/page.tsx:38`) instead of derived; admin margin bar under-scales (`margin * 2.5`, `app/admin/page.tsx:101`). Full list + file:line in `QA-E2E-AUDIT.md`.
- Accessibility backlog: 30 serious axe warnings (all color-contrast; worst on the dark landing + admin) — P2.

---

## ▶️ Next phase — what the next agent should do

> **v1 scope + the full Fase 1.x → Fase 2 sequence now live in AGENTS.md** (durable). This section
> tracks the current step.

**Done — Fase 1.0 (PR #23, merged):** error/loading/not-found boundaries, empty states, login
hardening, `signOut` try/catch, dead CTAs disabled behind "Próximamente", driver quick wins.

**Done — Fase 1.1 (PR #24 + fixes #26, merged):** DriverApp on real Supabase data, `Llegué`/`Salí`
GPS events, timer seeded from `hora_llegada_punto`, client-name RPC, realtime. Migrations `004`+`005`.

**Done — Fase 1.2 (PR #27, merged):** real photo (device camera) +
optional canvas signature → Storage (`lib/storage.ts` wired), `recibido_por` persisted, honest
evidence claim, resilient upload with retry, realtime `subscribe()` error handling + reconnect, and
`lib/supabase.ts` throws on missing env. Migration `006-recibido-por.sql` run in prod.

**🔴 Security first (infrastructure audit, 2026-08-15).** The audit document is deliberately **kept
out of this public repo** — it contains working exploit steps. It lives with the other handoffs
outside the tree (`/assets` is gitignored). The A–F plan is still
correct, it just isn't first anymore. Four criticals were confirmed against the schema, all from the
same root: *RLS is row-level and was used as if it were column-level.*

0. **RUN MIGRATION `007` IN PROD** — nothing below matters while a driver can `PATCH profiles` and
   become admin. Verification queries are in the migration header.
1. **Manual, yours, in the Supabase dashboard** — (a) rotate/delete the `*@despachr.test` users;
   `schema.sql` published `password123` in a **public repo**, so the credential is in git history
   forever and rotation is mandatory. (b) Confirm Authentication → Providers → Email →
   "Enable signup" stays **disabled** (second layer for C2).
2. **Segment A — auth/infra hardening**: real `/reset-password` (the `href="#"` at
   `login/page.tsx:151` is the last place the UI promises something it can't do), env validation in
   `middleware.ts:19-20`, `global-error.tsx`, scoped `error.tsx`/`loading.tsx` for admin+dashboard,
   delete the dead `components/auth/LogoutButton.tsx`.

**Then — finish the driver vertical, then coordinator:**

1. **Fase 1.3 — novedades UI** (issue reporting; `issues` table exists). **Blocked on a product
   decision:** does a novedad *close* the delivery or leave it retryable? That defines the state
   machine; guessing means rework.
2. **Fase 1.3b — driver OTP login UI** (phone sign-in): `signInWithOtp`/`verifyOtp` screen so phone-only drivers can authenticate. Sequenced here **on purpose** — Fase 1.4's offline session handling must be built on the *final* auth path, not on email/password that then gets swapped for OTP (would be double work). Note: `profiles.phone` stores the number **without** the leading `+` (Supabase Auth format, e.g. `573229596618`) → phone inputs and `tel:` links must normalize.
3. **Fase 1.4 — service worker + offline event queue.**
4. **Fase 2 — Coordinator** — real routes/deliveries + **real map** + Realtime + surface the `alerts` table (acknowledge/resolve). Needs its **own** path to deliveries — the `entregas_de_ruta` RPC is **driver-only by construction** (`driver_id = auth.uid()`), don't reuse it. **NOT blocked** (earlier claim was wrong): none of this touches `peso_kg`/`volumen_m3`, and coordinator RLS already grants SELECT on `clients`/`deliveries`/`routes` + SELECT/UPDATE on `alerts`, so no new RPC and no new migration are needed. `deliveries` already carries `latitude`/`longitude` → the real map is unblocked too. Only the **malla planner** waits on `peso_kg`/`volumen_m3` → **migration `008`** (007 went to the security hardening), pending pilot-client requirements.
6. **v1.1 — Admin** depth (KPIs, client CRUD, invoice workflow) — out of v1 scope.

**Two pending manual deploys (code already merged in #18 — the alert system isn't *live* until these are done):**
- **Telegram bot** — create via BotFather, then `supabase secrets set TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=…` + `supabase functions deploy check-tiempo-en-punto`.
- **pg_cron scheduling** — enable `pg_cron`/`pg_net`, then schedule the function every 5 min. Exact steps: `supabase/functions/check-tiempo-en-punto/README.md`.

---

## Infra / notes

- `main` in sync with origin · auto-deploy to Vercel on every push.
- Supabase env keys set across all 3 Vercel environments (incl. `NEXT_PUBLIC_SUPABASE_URL` in **Preview** — added this session; previews were failing without it).
- Migrations are **hand-run, repo-tracked SQL** in `scripts/migrations/` (`001`–`006`) — the project does **not** use Supabase CLI versioned migrations. Base schema: `scripts/schema.sql`. Manual dev-test helper (not a migration): `scripts/testing/fase-1.1-driver-datos-reales.sql`.
- Test users: `admin@ / coord@ / driver@ despachr.test` (QA credentials in a git-ignored file). ⚠️ These exist in **production** and `schema.sql` published a shared password until migration `007` — rotate them, and prefer separate non-prod users for QA.
- `/assets` is gitignored (design handoffs + QA artifacts live outside the repo); brand kit is versioned in `/public/brand`.
- Known/accepted deps: 2 moderate `postcss`-via-`next` audit findings — only fix is a Next 16→9 major downgrade, so deferred until Next patches its bundled postcss.
