#!/usr/bin/env node
// QA runner — visual + responsive + light/dark + a11y across every Despachr screen.
//
// DECISION: Playwright (not the Chrome --screenshot flag) because protected routes
// require a real Supabase session; we log in per role and reuse the context cookies.
//
// Usage:
//   node scripts/qa.mjs                 # all roles + public
//   node scripts/qa.mjs driver          # only the conductor app
//   node scripts/qa.mjs admin dashboard # admin + coordinador segments
//
// Reads test credentials from env (see .env.local.example). Protected routes are
// skipped with a note when creds are absent, so the public landing + login always run.

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

loadEnv({ path: '.env.local' })

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000'
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]
const THEMES = ['light', 'dark']

// timestamp passed in by the harness (the script can't call Date.now in some contexts,
// but here we run standalone via node, so a wall clock is fine).
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const OUT_DIR = path.join('assets', 'qa', STAMP)

// Each "segment" maps to a role login + its routes. landingFixedDark routes ignore
// the light pass because the marketing page is intentionally dark-only.
const SEGMENTS = {
  public: {
    role: null,
    routes: [
      { path: '/', label: 'landing', fixedDark: true },
      { path: '/login', label: 'login' },
    ],
  },
  dashboard: {
    role: 'coordinador',
    routes: [
      { path: '/dashboard', label: 'operacion-en-vivo' },
      { path: '/dashboard/rutas', label: 'rutas' },
      { path: '/dashboard/conductores', label: 'conductores' },
      { path: '/dashboard/clientes', label: 'clientes' },
    ],
  },
  admin: {
    role: 'admin',
    routes: [
      { path: '/admin', label: 'metricas' },
      { path: '/admin/clientes', label: 'clientes' },
      { path: '/admin/facturacion', label: 'facturacion' },
      { path: '/admin/reportes', label: 'reportes' },
    ],
  },
  driver: {
    role: 'conductor',
    routes: [{ path: '/driver', label: 'app-conductor' }],
  },
}

const CREDS = {
  admin: { email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD },
  coordinador: { email: process.env.QA_COORDINADOR_EMAIL, password: process.env.QA_COORDINADOR_PASSWORD },
  conductor: { email: process.env.QA_CONDUCTOR_EMAIL, password: process.env.QA_CONDUCTOR_PASSWORD },
}

// Optional a11y engine — degrade gracefully if not installed.
let AxeBuilder = null
try {
  ;({ AxeBuilder } = await import('@axe-core/playwright'))
} catch {
  console.warn('⚠  @axe-core/playwright not installed — skipping a11y checks.')
}

const asked = process.argv.slice(2).map((s) => s.toLowerCase())
const segments = asked.length
  ? Object.entries(SEGMENTS).filter(([k]) => asked.includes(k) || (asked.includes('driver') && k === 'driver'))
  : Object.entries(SEGMENTS)
// always include public unless a specific segment was requested without it
const runSegments = asked.length ? segments : Object.entries(SEGMENTS)

async function login(context, role) {
  const cred = CREDS[role]
  if (!cred?.email || !cred?.password) return { ok: false, reason: 'no-credentials' }
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.fill('#email', cred.email)
    await page.fill('#password', cred.password)
    await page.click('button[type="submit"]')
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
    return { ok: true }
  } catch {
    return { ok: false, reason: 'login-failed' }
  } finally {
    await page.close()
  }
}

// Trigger IntersectionObserver-based reveals by stepping through the page,
// then return to the top so the full-page screenshot starts clean.
async function autoScroll(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const step = Math.round(window.innerHeight * 0.5)
    let y = 0
    // Re-read scrollHeight each iteration — revealing sections can grow the page.
    while (y <= document.documentElement.scrollHeight) {
      window.scrollTo(0, y)
      await sleep(220) // let each IntersectionObserver reveal fire + animate
      y += step
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
    await sleep(350) // dwell at the bottom so the last section settles
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(400)
}

const results = []

async function visit(context, segName, route, theme) {
  if (route.fixedDark && theme === 'light') return // landing is dark-only
  const page = await context.newPage()
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t)
    } catch {}
  }, theme)

  const consoleErrors = []
  const pageErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  for (const vp of VIEWPORTS) {
    consoleErrors.length = 0
    pageErrors.length = 0
    await page.setViewportSize({ width: vp.width, height: vp.height })
    let navOk = true
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 30000 })
      // Scroll-reveal sections (IntersectionObserver) render blank in a full-page
      // shot unless they've scrolled into view first. Step down, then back to top.
      await autoScroll(page)
      await page.waitForTimeout(700) // let fadeUp/pop animations settle
    } catch (e) {
      navOk = false
      pageErrors.push(`nav: ${e.message}`)
    }

    const file = `${segName}_${route.label}_${vp.name}_${theme}.png`
    if (navOk) {
      await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true })
    }

    let a11y = []
    if (AxeBuilder && navOk) {
      try {
        const scan = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
        a11y = scan.violations
          .filter((v) => ['serious', 'critical'].includes(v.impact))
          .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))
      } catch {}
    }

    results.push({
      segment: segName,
      route: route.path,
      viewport: vp.name,
      theme,
      screenshot: navOk ? file : null,
      consoleErrors: [...consoleErrors],
      pageErrors: [...pageErrors],
      a11y,
    })
  }
  await page.close()
}

function buildReport() {
  const lines = [`# QA report — ${STAMP}`, '', `Base URL: ${BASE}`, '']
  const withConsole = results.filter((r) => r.consoleErrors.length)
  const withPage = results.filter((r) => r.pageErrors.length)
  const withA11y = results.filter((r) => r.a11y.length)
  const failedNav = results.filter((r) => !r.screenshot)

  lines.push('## Summary', '')
  lines.push(`- Screens captured: ${results.filter((r) => r.screenshot).length}/${results.length}`)
  lines.push(`- Page errors (JS exceptions): ${withPage.length}`)
  lines.push(`- Console errors: ${withConsole.length}`)
  lines.push(`- A11y (serious/critical): ${withA11y.length}`)
  lines.push(`- Navigation failures: ${failedNav.length}`)
  lines.push('')

  const verdict = withPage.length || failedNav.length ? '❌ FAIL' : withConsole.length || withA11y.length ? '⚠ WARN' : '✅ PASS'
  lines.push(`**Verdict: ${verdict}**`, '')

  for (const group of ['pageErrors', 'consoleErrors', 'a11y']) {
    const hits = results.filter((r) => r[group].length)
    if (!hits.length) continue
    lines.push(`## ${group}`, '')
    for (const r of hits) {
      lines.push(`### ${r.route} · ${r.viewport} · ${r.theme}`)
      for (const item of r[group]) {
        lines.push(`- ${typeof item === 'string' ? item : `[${item.impact}] ${item.id} (${item.nodes}×) — ${item.help}`}`)
      }
      lines.push('')
    }
  }

  lines.push('## All screens', '')
  for (const r of results) {
    const flags = []
    if (r.pageErrors.length) flags.push(`${r.pageErrors.length} page-err`)
    if (r.consoleErrors.length) flags.push(`${r.consoleErrors.length} console-err`)
    if (r.a11y.length) flags.push(`${r.a11y.length} a11y`)
    const tag = flags.length ? `⚠ ${flags.join(', ')}` : '✓'
    lines.push(`- \`${r.route}\` ${r.viewport}/${r.theme} — ${tag}${r.screenshot ? ` — ${r.screenshot}` : ' — (no screenshot)'}`)
  }
  return lines.join('\n')
}

async function main() {
  if (!existsSync('node_modules/playwright') && !existsSync('node_modules/.bin/playwright')) {
    console.error('✗ playwright not installed. Run: npm i -D playwright @axe-core/playwright dotenv && npx playwright install chromium')
    process.exit(2)
  }
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const skipped = []

  for (const [segName, seg] of runSegments) {
    const context = await browser.newContext({ deviceScaleFactor: 1 })
    if (seg.role) {
      const auth = await login(context, seg.role)
      if (!auth.ok) {
        skipped.push(`${segName} (${seg.role}): ${auth.reason}`)
        await context.close()
        continue
      }
    }
    for (const route of seg.routes) {
      for (const theme of THEMES) {
        await visit(context, segName, route, theme)
      }
    }
    await context.close()
  }
  await browser.close()

  const report = buildReport()
  await writeFile(path.join(OUT_DIR, 'report.md'), report)
  await writeFile(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2))

  console.log(report)
  if (skipped.length) {
    console.log('\n## Skipped segments\n' + skipped.map((s) => `- ${s}`).join('\n'))
  }
  console.log(`\n→ Report + screenshots in ${OUT_DIR}/`)

  const hardFail = results.some((r) => r.pageErrors.length || !r.screenshot)
  process.exit(hardFail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
