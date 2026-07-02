---
name: qa
description: Run a full QA pass on Despachr — build + lint, then a Playwright sweep of every screen at desktop + mobile in light + dark, capturing screenshots, console/JS errors, and accessibility violations. Use when asked to QA the app, verify screens before deploy, or check a UI change across roles/themes/viewports. Optional args scope it to a segment — `/qa driver`, `/qa admin`, `/qa dashboard`, `/qa public`.
---

# QA — full-app verification pass

You are running QA for Despachr. Work through the phases in order. Stop and report at the first **hard failure** (build/lint break, or the browser run can't start) — those block everything downstream.

`$ARGUMENTS` (optional) scopes the browser run to one or more segments: `public`, `dashboard` (coordinador), `admin`, `driver`. No args = everything.

## Phase 1 — Static checks (fast, no browser)

Run from the repo root:

```bash
npm run lint
npm run build
```

- **Lint errors** → report them and stop; don't bother with the browser run, the build output may be stale.
- **Build errors** (TypeScript / broken imports) → report and stop.
- Both green → continue.

## Phase 2 — Ensure the dev server is up

The browser run needs `http://localhost:3000` serving the app.

```bash
curl -sf -o /dev/null http://localhost:3000 && echo "up" || echo "down"
```

If **down**, start it in the background and wait for it to answer:

```bash
npm run dev   # run_in_background: true
```

Poll `curl -sf http://localhost:3000` until it returns 200 (give it ~20s). Note whether you started it — leave a note in the final report if you did, so the user knows a background server is running.

## Phase 3 — First-run setup (only if Playwright is missing)

Check once:

```bash
ls node_modules/.bin/playwright 2>/dev/null || echo "missing"
```

If missing, install the tooling (these are devDependencies):

```bash
npm i -D playwright @axe-core/playwright dotenv
npx playwright install chromium
```

## Phase 4 — Credentials check

Protected routes (`/dashboard/*`, `/admin/*`, `/driver`) need a real Supabase login. The runner reads test creds from `.env.local`:

```
QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD
QA_COORDINADOR_EMAIL / QA_COORDINADOR_PASSWORD
QA_CONDUCTOR_EMAIL / QA_CONDUCTOR_PASSWORD
```

```bash
grep -c "QA_.*_EMAIL" .env.local 2>/dev/null || echo 0
```

If creds are missing, the run still covers the **public landing + login** and simply skips the protected segments (the report lists what was skipped). Tell the user which segments will be skipped and that they can add seed-user creds to `.env.local` to cover them — don't block on it unless they asked specifically for a protected segment.

## Phase 5 — Browser sweep

```bash
node scripts/qa.mjs $ARGUMENTS
```

This visits every in-scope route at **1440×900 and 390×844**, in **light and dark** (the `/` landing is dark-only by design), and for each:
- saves a full-page screenshot,
- records console errors and uncaught JS exceptions,
- runs an axe-core WCAG 2 A/AA scan (serious + critical only).

Output lands in `assets/qa/<timestamp>/` — `report.md`, `results.json`, and the PNGs. Exit code: `0` clean/warn-only, `1` hard failure (JS exception or a screen that wouldn't load), `2` setup problem.

## Phase 6 — Interpret & report

Read `assets/qa/<timestamp>/report.md`, then **look at a few screenshots yourself** with the Read tool — especially any screen flagged with errors, plus one mobile and one dark-mode shot — to catch layout breakage that error counts won't show (overflow, clipped text, broken sidebar, unreadable contrast).

Give the user a tight summary:
- **Verdict**: PASS / WARN / FAIL and why.
- **Blocking issues** first (JS exceptions, screens that didn't render), with route · viewport · theme.
- **Then** console errors and a11y violations, grouped.
- **Visual notes** from the screenshots you inspected.
- Path to the report dir and whether you left a dev server running.

Be concrete — `"/admin/facturacion mobile/dark: table overflows viewport, right column clipped"` beats `"some layout issues"`. Don't fix anything unless the user asks; QA reports, it doesn't patch.
