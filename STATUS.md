# Despachr — Current Status (2026-08-16)

**What it is:** A PWA for cargo-logistics management (Colombia / LATAM) that replaces the Excel + WhatsApp workflow.
**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr

**In one line:** **v1 scope is code-complete.** Both operational verticals — **driver** (real data, GPS,
cumplido, novedades, OTP login, full offline) and **coordinator** (real routes/drivers/clients, real
map, live alerts, Realtime) — run on live Supabase. **Admin is the only mock surface left**, deferred
to v1.1 by scope decision and marked as such on all four screens. Remaining work is **not code**: four
manual steps below, then an end-to-end pass.

> **Doc map:** `AGENTS.md` = durable reference (product/stack/conventions, auto-loaded) · **this file
> (STATUS.md)** = living state + next steps (overwrite each session) · `CHANGELOG.md` = append-only
> history · `QA-E2E-AUDIT.md` = latest audit (2026-08-06, predates this session's work).

---

## ⚠️ Everything left is Supabase configuration, not code

**→ Full runbook: [SUPABASE-PENDIENTE.md](SUPABASE-PENDIENTE.md)** — the four tasks with exact SQL and
commands, plus what an agent can and cannot do for each.

| # | Action | What stays broken without it |
|---|--------|------------------------------|
| 1 | **Rotate the 5 `*@despachr.test` passwords** (Authentication → Users). **Rotate, don't delete** — `routes.driver_id` has no `ON DELETE`. | `schema.sql` published a shared password in a **public repo** until migration `007`. It is in git history forever; removing it from the file did not unpublish it. `admin@` is the urgent one. |
| 2 | **Add Redirect URLs** (Authentication → URL Configuration) for `/reset-password` | Password reset sends the email, then the link bounces. |
| 3 | **Check `deliveries.latitude/longitude` are populated** | The map correctly shows its explained-empty state instead of pins. |
| 4 | **Deploy Telegram bot + `pg_cron`** | The coordinator's alerts card renders correctly but stays **empty** — nothing inserts alerts. |

Also confirm **"Allow new users to sign up" is still OFF** (turned off during the `007` remediation; it
must stay off — see AGENTS.md).

### To let the next session help with any of this

Verified 2026-08-16: the CLI has **no stored credential** and the Supabase **MCP tools are not in the
session**. Two different causes, one fix — export the token **before launching**, because MCP tools
register at session start and `supabase login` cannot run without a TTY:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...   # Supabase → Account → Access Tokens
claude                                  # launch AFTER the export
```

That authenticates both `.mcp.json` and the CLI. **Never paste the token into chat** — this repo is
public and already had one credential incident. Details in [SUPABASE-PENDIENTE.md](SUPABASE-PENDIENTE.md).

---

## ✅ What actually works today

### Driver (complete)
- **Login by phone OTP** — `/login`, phone tab first. `signInWithOtp` with `shouldCreateUser: false`,
  60s resend cooldown, `one-time-code` autofill. Email/password remains for admin/coordinator.
- **Real route + deliveries**; client name via the driver-only `entregas_de_ruta` RPC.
- **`Llegué` / `Salí`** insert `delivery_events` with GPS; DB triggers derive state — the app re-reads,
  never recomputes. GPS never blocks.
- **Cumplido** — device-camera photo + optional signature → Storage, receiver name, resilient retry
  that resumes rather than restarting.
- **Novedades** — 6 types, required description, optional photo. **A novedad closes the delivery.**
- **Offline, end to end** — IndexedDB queue (photos as Blobs); client-generated ids and timestamps so
  replay is idempotent and records when it *happened*, not when it synced; service worker so the app
  opens with no network; route snapshot so a cold offline start still shows the stops, labelled with
  its age.

### Coordinator (complete)
- **Live operation, routes, drivers, clients** on real Supabase + **Realtime**.
- **Real map** — MapLibre + CARTO. Deliveries by coordinates; last known position per route derived
  from event coordinates, shown **with its timestamp** (there is no continuous tracking in the schema).
- **Alerts** — read from `alerts`, resolvable with a record of who and when.

### Platform
- **Security** — migration `007` closed privilege escalation via `profiles.role`, signup role
  injection, a publicly callable seeder, and driver writes to `valor_flete`. Public signup turned off.
- **Next 16.3.1** — middleware-bypass CVE fixed. `npm audit`: **0 vulnerabilities**.
- **41 logic tests** (`npm test`) over cumplido/novedad ordering and resume, offline queue ordering,
  and phone normalisation. Playwright sweep (`npm run qa`) covers the screens.
- Error/loading boundaries, empty states, password reset, fail-closed middleware.
- **Contrast**: all token pairs verified ≥4.5:1.

---

## 🚧 Honest gaps

- **Admin (4 screens) is mock** — v1.1 by decision. All four carry the "Datos de demostración" notice.
- **Untested against a live network**: password reset round-trip, OTP SMS send, and the map with real
  coordinates. All three are blocked on the manual steps above, not on code.
- **Contrast verified by calculation**, not yet by an axe run — arithmetic catches the systematic
  cause but not a combination nobody thought to check. Fold it into the QA sweep.
- **Landing pricing** is still mock.
- **No ETA anywhere** — deliberate. Estimating one needs route optimisation, which is post-v1.
- ~12 unbuilt CTAs are disabled behind a "Próximamente" tooltip.

---

## ▶️ What's next

1. **The four manual steps**, then an E2E pass on desktop + phone.
2. **v1.1 — Admin depth** (KPIs, client CRUD, invoicing) now that real data will start accumulating.
3. **Migration `008`** (`peso_kg` / `volumen_m3`) → unblocks the **malla planner**. Still waiting on
   pilot-client requirements; nothing else depends on it.
4. Post-v1: multi-tenant, pricing, Sistran/Cigo, route optimisation.

---

## Infra / notes

- `main` in sync with origin · auto-deploy to Vercel on every push · **13 PRs merged this session
  (#29–#41)**.
- Migrations are **hand-run, repo-tracked SQL** in `scripts/migrations/` (`001`–`007`). Base schema:
  `scripts/schema.sql`.
- **Provisioning changed in `007`:** a new user's role comes from **`app_metadata`**, never
  `user_metadata`. From the dashboard, create the user (it defaults to `conductor`) and promote with
  `update public.profiles set role = …` in the SQL Editor.
- `/assets` is gitignored; the infrastructure/security audit is deliberately **kept out of this public
  repo** (it contains working exploit steps).
