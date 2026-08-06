# Despachr — End-to-End QA Audit

**Date:** 2026-08-06
**Build:** `main` @ `48ac867` (through PR #27) · Next.js 16.2.9 · React 19
**Method:** Automated Playwright sweep (42 screens · all roles · desktop+mobile · light+dark · axe WCAG 2 A/AA) + 4-area code audit (driver / coordinator / admin / auth+infra) + manual visual inspection.
**Environment:** local dev server, real Supabase seed logins.

---

## Verdict

**The driver vertical is now functionally complete; coordinator + admin remain mock by design (Fase 2).** With PR #27, the driver's **cumplido capture is real end-to-end** — real camera, real signature pad, uploads to Supabase Storage, evidence persisted to the delivery row. Combined with earlier PRs, the entire driver flow (real data → GPS → capture → persist → realtime) now works against the live backend. What's left is smaller: driver *novedades* + OTP-login UI, a handful of auth-hardening gaps, and the (documented) Fase-2 wiring of the coordinator/admin panels.

| Signal | 07-04 | 07-24 | 07-25 | 08-06 |
|--------|:--:|:--:|:--:|:--:|
| Screens captured | 42/42 | 42/42 | 42/42 | **42/42** ✅ |
| JS exceptions | 0 | 0 | 0 | **0** ✅ |
| Console errors | 16 | 0 | 0 | **0** ✅ |
| Navigation failures | 0 | 0 | 0 | **0** ✅ |
| A11y serious/critical | 35 | 35 | 34 | **30** ↓ |
| Driver cumplido (photo/sig) | faked | faked | faked | **✅ real + persisted** |
| Driver data / GPS / realtime | mock | mock | ✅ | **✅** |
| Infra (error/loading/404/empty) | ❌ | ❌ | ✅ | **✅** |
| Coordinator / admin data | mock | mock | mock | mock *(Fase 2)* |

Screenshots: `assets/qa/2026-08-06T21-42-57/` (gitignored). Re-run: `npm run qa`.

---

## ✅ Fixed since last audit — verified this run

**Driver cumplido capture (PR #27) — all five sub-claims verified with file:line:**
- **Real photo** — `<input type="file" accept="image/*" capture="environment">` (`DriverApp.tsx:705`) + JPEG compression pipeline (`lib/storage.ts:54-96`). No more hardcoded `FOTO_CARGA_01.jpg`.
- **Real signature** — new `components/driver/SignaturePad.tsx` canvas component (pointer events, `toBlob()` → PNG). No more hardcoded "Andrés R.".
- **Both uploaded** — `uploadCumplido()` / `uploadFirma()` called on confirm (`DriverApp.tsx:636,643`); deterministic paths, idempotent 409-as-success retry.
- **Persisted** — `marcarEntregada()` now writes `foto_cumplido_url`, `firma_url`, `recibido_por`, then flips `estado='entregado'` last (`lib/queries/driver.ts:128-142`; migration `006-recibido-por.sql`).
- **Done-screen evidence is now truthful** — computed from real `fotoUrl`/`firmaUrl` after a refetch (`DriverApp.tsx:810-816`), not hardcoded.

**Bonus fixes that closed prior findings:**
- Realtime `subscribe()` **now handles errors** — `CHANNEL_ERROR`/`TIMED_OUT` → "Sin conexión en vivo · reintentando…" + auto-reconnect (`DriverApp.tsx:166-174`). *(was a prior minor bug)*
- **Receiver name persists** (`recibido_por`). *(was open)*
- **Env vars validated** — `lib/supabase.ts:11-16` throws on missing URL/key instead of silent `''`. *(was open)*
- **A11y improved** — 34 → 30 serious/critical.

**No regressions** — all prior fixes intact (safeRedirect, silent-role-fallback in login+middleware, ThemeToggle aria-label guard, error/loading/not-found boundaries, login validation, logout try/catch in DashboardShell + driver).

---

## Bugs found this run

- **[minor] Coordinator "Completadas" stat is hardcoded** — `app/dashboard/page.tsx:38` shows `value="1"` while the mock has 2 `completada` routes (the rutas page computes it correctly via `.filter(...)`). Home-page stats (`En ruta`/`Completadas`/`Paradas hoy`/`Retrasadas`) are static literals. Low impact today (mock data), but will mislead once wired.
- **[minor] Admin margin bar under-scales** — `app/admin/page.tsx:101` uses `width: ${p.margin * 2.5}%`, so a 26% margin fills only 65% of the bar. Should normalize to the max (`margin / maxMargin * 100`).
- **[minor] Driver capture edge cases** — receiver input has no `maxLength`/validation beyond non-empty (`DriverApp.tsx:774`); signature `toBlob()` returning null is skipped silently with no toast (`:643`); photo `input.value=''` reset is brittle on some browsers (`:607`).
- **[minor] Orphaned-upload risk** — if `marcarEntregada()` fails *after* the photo/signature upload, the files live in Storage unlinked to any delivery; retry re-runs the final step but DB state is ambiguous. Acceptable for MVP; worth monitoring/cleanup in prod (`DriverApp.tsx:627-681`).

---

## Still open — by priority

### P1 — Driver vertical remainder (Fase 1.3 / 1.3b / 1.4)
- **Novedades (issue reporting) UI absent** — `TipoNovedad`/`issues` exist in schema/types, but there's no driver screen to file rechazo/faltante/dañado/etc. A delivery in `estado='novedad'` only shows a badge.
- **Driver OTP login UI absent** — backend ready (PR #19, Twilio), but `/login` is email/password only; no `signInWithOtp`.
- **No PWA service worker / offline queue** — manifest exists but there's no offline capture/sync (most relevant for drivers in low-signal areas).

### P1 — Auth / hardening (remaining)
- **Password reset dead** — `login/page.tsx:151` "¿Olvidaste tu contraseña?" is `href="#"`; no `/reset-password`. Highest-impact remaining auth gap — implement or remove.
- **Middleware doesn't validate env vars** — `middleware.ts:19-20` uses `!` non-null assertions; `lib/supabase.ts` throws but the middleware path doesn't. Add an explicit check.
- **No `global-error.tsx`**, and **no admin/dashboard-scoped `error.tsx`/`loading.tsx`** (only root + driver are scoped).
- **`components/auth/LogoutButton.tsx` is dead code** (unused, no try/catch) — delete or align with the DashboardShell pattern.
- **Hardening (medium):** no CSP headers; login relies on Supabase's default auth rate-limiting (no app-level throttle).

### Deferred by design — Coordinator + Admin (Fase 2)
Still **0 Supabase wiring** on these 8 pages (all `lib/mock/*`); dead CTAs are correctly disabled via `<ComingSoon>`.
- **Coordinator:** real map (`LiveMap` is a static SVG), **alert escalation** (`AlertsCard` read-only — the ">60 min → escalate" loop unmet, and the 60-min edge function isn't deployed/scheduled), route/driver/client **detail drill-downs** (rows not clickable), weekly **malla** planner (absent), Realtime, live date/counts (`dashboard/page.tsx:24` static).
- **Admin:** client CRUD, invoice creation + status + **AR aging/DSO** (absent), report generation/export, **PeriodToggle not wired**, **`/admin/conductores` driver-management page doesn't exist**.
- Blocker for Fase-2 capacity checks: migration `007` (`peso_kg`/`volumen_m3`) queued, not run.

### P2 — Accessibility (30 serious/critical, all `color-contrast`)
Worst: landing `/` dark 13/12; `/admin` dark 11 / light 9; `/dashboard/*` light 5–7. Fix muted-foreground tokens to 4.5:1 (3:1 large), especially dark-mode landing captions + admin secondary text.

### Minor / polish
- Wide admin tables (clientes, facturación) still **clip on mobile** — add horizontal scroll affordance or a card layout at `sm`.
- `manifest.ts` `theme_color:#0A0A0A` shows a dark status bar in light mode.

---

## What works ✅
Real Supabase auth + role routing + middleware protection (RLS verified; SECURITY DEFINER RPC for safe client-name joins); **complete driver flow on live data** — today's route/deliveries by driver, GPS events, realtime with reconnect, live timer, **real photo + signature capture → Storage → persisted evidence**, Navegar/Llamar (Maps + `tel:`), empty state, error boundary; logout (try/catch); mobile sidebar drawer; theme toggle (no hydration error); login validation; env-var validation; navigation; landing + login responsive; **build green · 0 runtime exceptions · 0 console errors across 42 screens**.

---

## Recommended order of work
1. **Finish the driver vertical** — novedades UI (Fase 1.3), then OTP login UI (Fase 1.3b). Add the small capture-flow guards (receiver `maxLength`, signature-null toast, orphaned-upload check).
2. **Close auth gaps** — password reset flow, middleware env-var check, `global-error.tsx`, delete/fix dead `LogoutButton`.
3. **Quick correctness fixes** — hardcoded "Completadas" stat; admin margin-bar scaling.
4. **Begin coordinator wiring (Fase 2)** — run migration 007; replace `lib/mock/coordinator.ts` with queries + Realtime; route detail + alert escalation; deploy the 60-min alert function. Then admin (CRUD, invoicing, `/admin/conductores`, AR aging/DSO, PeriodToggle).
5. **A11y contrast pass** + admin mobile-table affordance + offline/service-worker (Fase 1.4).

---

*Generated from `npm run qa` (Playwright + axe) + a 4-area code audit; every finding cites file:line. PR #27 and all prior fixes were re-verified against current code; the driver real-data/capture path was confirmed by inspecting screenshots this run. This file supersedes the earlier dated audit reports.*
