# Despachr — Current Status (2026-08-20)

**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr · **Supabase:** `mxgfkwwdhnoumboftjal`

**One line:** v1 is **code-complete and deployed**, all Supabase config is **done**, and the owner is
**mid-E2E** (started with admin, driver last). No engineering work is queued or blocked.

> Doc map: `AGENTS.md` durable reference (auto-loaded) · **this file** = state + next steps ·
> `CHANGELOG.md` history · `SUPABASE-PENDIENTE.md` infra runbook · `PREGUNTAS-CLIENTE.md` open
> product questions.

---

## Read this first if you are the next agent

```bash
# Export BEFORE launching, or you get neither the MCP tools nor the CLI.
export SUPABASE_ACCESS_TOKEN=sbp_...     # Supabase → Account → Access Tokens
claude
```
MCP tools register at session start; `supabase login` cannot run without a TTY. Both read this var.
**Never let a credential into the chat** — it happened three times on 2026-08-16/17 (a management
token, then the `service_role` key with five passwords). Design the no-paste path *before* handing
over a command. See the memory note `secrets-never-in-chat`.

**Run the canary immediately:**
```bash
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  https://api.supabase.com/v1/projects/mxgfkwwdhnoumboftjal/config/auth \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('disable_signup =',d['disable_signup']);print('site_url =',d['site_url'])"
```
Expected `True` and `https://despachr.vercel.app`. On 2026-08-16 `disable_signup` silently flipped
back to open once and the cause was never found (org audit logs need a paid plan; the repo has no
Actions, no `vercel.json`, no `config.toml`, no branching). **If either value reverted, something is
re-applying project config and it is worth hunting.** If both hold, it was a one-off.

---

## ✅ Done

**v1 code** — 20 PRs (#29–#48). Driver vertical (real data, GPS, cumplido, novedades, phone OTP,
full offline: IndexedDB queue + service worker + route snapshot) and coordinator vertical (real
routes/drivers/clients, MapLibre map, live alerts with resolve, Realtime). 41 logic tests, `npm audit`
clean, contrast pairs ≥4.5:1.

**Supabase config** — passwords rotated in place, redirect URLs added, `site_url` fixed to
production, signup closed, coordinates confirmed (6/6), `pg_cron` + `pg_net` enabled,
`check-tiempo-en-punto` deployed and **cron verified running every 5 min**. A real alert is in the
table.

**Telegram dropped** by product decision (2026-08-17) — wrong channel for Colombia, and only 1–2
people need the push. In-app alerts are the system; SMS via the existing Twilio account is the
escalation if the coordinator reports missing them; WhatsApp only when a customer pays. Rationale in
AGENTS.md, including the tension that this product is sold to *replace* WhatsApp coordination.

---

## ⬜ Owner's queue

1. **Finish the E2E.** Admin first (in progress, via a browser agent), then coordinator, then driver
   on a phone. The best single test is the cross-check: coordinator panel open on desktop while the
   driver marks *Llegué* on the phone — the panel must move on its own. That is Realtime, which is
   what replaces WhatsApp.
2. **Revoke two `sbp_` access tokens** — `sbp_0300…` (pasted in chat, still valid) and `sbp_d305…`
   (literal inside `.claude/settings.local.json`, now gitignored). No real token ever reached git
   history; the `sbp_...` in the docs are placeholders.
3. `rm .secrets-rotacion.txt` once the passwords are in a manager.
4. **Ask the 5 questions** in `PREGUNTAS-CLIENTE.md` (A1, A2, A4, B1, E1) → unblocks migration `008`
   and the malla planner.

---

## 🚧 Honest gaps

- **Admin's 4 screens are mock** — v1.1 by scope decision, all four carry the demo notice.
- **Password reset cannot be tested with the current accounts.** `@despachr.test` receives no mail.
  To exercise it, point one account at a real address first.
- **Three of the four Business KPIs in AGENTS.md are not computable.** "On-time %" — the one
  coordinators supposedly obsess over — has nothing to compare an arrival against; no committed time
  or window is stored per delivery. Cost/km needs `routes.distancia_km`, which nothing populates.
  These are product questions (`PREGUNTAS-CLIENTE.md`), not missing code, and they would otherwise
  surface as apparent bugs when v1.1 admin gets built.
- **`QA-E2E-AUDIT.md` (2026-08-06) overstates its coverage.** PR #48 found `qa.mjs` never loaded
  `.env.qa-credentials` and read `QA_ADMIN_EMAIL` while the file defines `ADMIN_EMAIL` — so every
  protected route was skipped silently. Its "42/42 screens" only ever covered landing + login. The
  next `npm run qa` is the first real sweep. Against production:
  `QA_BASE_URL=https://despachr.vercel.app npm run qa`
- **Contrast verified by arithmetic**, not yet by an axe run — fold that into the sweep.
- Landing pricing is mock. No ETA anywhere (deliberate — needs route optimisation, post-v1).
- The alert reads *73638 min en el punto*: a seed delivery has sat `en_punto` since June. Correct,
  but it looks alarming during the E2E.
- `verify_jwt` does **not** protect the edge function — the anon key passes it and is public.
  Impact low (no params, counts only, duplicate-proof). Closing it needs a shared secret inside the
  function. Noted in its README, not done.

---

## ▶️ Next engineering work

1. **v1.1 — Admin depth** (KPIs, client CRUD, invoicing). Blocked on the money questions (block F).
2. **Migration `008`** (`peso_kg` / `volumen_m3`) → malla planner. Blocked on A1/A2/A4.
3. Post-v1: multi-tenant, pricing, Sistran/Cigo, route optimisation.

---

## Notes

- Migrations are hand-run, repo-tracked SQL in `scripts/migrations/` (`001`–`007`).
- **Provisioning changed in `007`:** a new user's role comes from `app_metadata`, never
  `user_metadata`. Create in the dashboard (defaults to `conductor`), then promote via SQL Editor.
- `scripts/rotate-test-passwords.mjs` rotates test passwords via Admin API — writes to
  `.secrets-rotacion.txt`, prints nothing secret, guarantees update-not-recreate.
- The security audit is deliberately **out of this public repo** (working exploit steps).
