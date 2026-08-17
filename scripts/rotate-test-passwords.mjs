#!/usr/bin/env node
/**
 * Rota la contraseña de las cuentas de prueba vía Admin API.
 *
 * POR QUÉ EXISTE: `scripts/schema.sql` publicó una contraseña compartida en un
 * repo PÚBLICO hasta la migración 007. Está en la historia de git para siempre.
 *
 * POR QUÉ NO SE HACE A MANO NI CON UN AGENTE DE NAVEGADOR:
 *  - `updateUserById` GARANTIZA actualizar, no recrear. Borrar y volver a crear
 *    rompería las FK (routes.driver_id → drivers.id, sin ON DELETE) y perdería
 *    el created_at.
 *  - La service role key se lee del ENTORNO: nunca pasa por un chat ni queda en
 *    la transcripción de un agente.
 *
 * USO:
 *   export SUPABASE_SERVICE_ROLE_KEY=...        # Settings → API Keys
 *   node scripts/rotate-test-passwords.mjs      # muestra las nuevas y las guarda
 *
 * La salida va a stdout UNA vez: cópiala a tu gestor de contraseñas. También
 * reescribe .env.qa-credentials (gitignored) para que `npm run qa` siga entrando.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://mxgfkwwdhnoumboftjal.supabase.co'
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY.\n  export SUPABASE_SERVICE_ROLE_KEY=...  (Settings → API Keys)')
  process.exit(1)
}

// Sólo las cuentas con contraseña. El usuario solo-teléfono (573229596618)
// entra por OTP y NO tiene contraseña que rotar: se excluye a propósito.
// El alias es el prefijo de la variable en .env.qa-credentials. Se mapea
// EXPLÍCITAMENTE porque ese archivo usa nombres en español (COORDINADOR,
// CONDUCTOR) que no se derivan del correo. driver2/driver3 no tienen variable:
// `npm run qa` sólo entra con tres roles.
const CUENTAS = [
  { email: 'admin@despachr.test', alias: 'ADMIN' },
  { email: 'coord@despachr.test', alias: 'COORDINADOR' },
  { email: 'driver@despachr.test', alias: 'CONDUCTOR' },
  { email: 'driver2@despachr.test', alias: null },
  { email: 'driver3@despachr.test', alias: null },
]

// 24 chars base64url ≈ 144 bits. Sin diccionario, sin relación con el correo.
const generar = () => randomBytes(18).toString('base64url')

const api = async (path, init = {}) => {
  const res = await fetch(`${URL_BASE}/auth/v1/admin${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

const { users } = await api('/users?per_page=200')
const porEmail = new Map(users.filter((u) => u.email).map((u) => [u.email, u]))

const resultado = []
for (const { email, alias } of CUENTAS) {
  const u = porEmail.get(email)
  if (!u) {
    console.error(`⚠️  no existe: ${email} — se omite`)
    continue
  }
  const password = generar()
  const antes = u.created_at
  const actualizado = await api(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ password }) })
  // Confirma que se ACTUALIZÓ y no se recreó.
  const ok = actualizado.created_at === antes
  console.error(`${ok ? '✓' : '✗'} ${email}${ok ? '' : '  ¡created_at cambió! revisar'}`)
  resultado.push({ email, password, alias })
}

console.log('\n--- Guarda esto en tu gestor de contraseñas ---')
for (const { email, password } of resultado) console.log(`${email.padEnd(24)} ${password}`)
console.log('---\n')

// Mantener .env.qa-credentials en sync para que `npm run qa` siga funcionando.
try {
  const ruta = '.env.qa-credentials'
  let txt = readFileSync(ruta, 'utf8')
  let cambiadas = 0
  for (const { password, alias } of resultado) {
    if (!alias) continue
    const re = new RegExp(`^(${alias}_PASSWORD=).*$`, 'm')
    if (re.test(txt)) {
      txt = txt.replace(re, `$1${password}`)
      cambiadas++
    }
  }
  writeFileSync(ruta, txt)
  console.error(`↻ ${ruta}: ${cambiadas}/3 contraseñas actualizadas`)
} catch {
  console.error('ℹ️  No se pudo actualizar .env.qa-credentials — actualízalo a mano para que `npm run qa` entre.')
}
