// Normalización de teléfonos para Supabase Auth.
//
// FORMATO CANÓNICO: sólo dígitos con indicativo de país y SIN el `+` inicial
// (ej. `573229596618`). Es como GoTrue guarda `auth.users.phone` y como quedó
// `profiles.phone`; si la app enviara `+57…` a un sitio y `57…` a otro, los
// números dejarían de emparejar y el login por OTP fallaría de forma opaca.
// Twilio sí necesita el `+`, pero eso lo agrega GoTrue al despachar el SMS.

const DEFAULT_COUNTRY_CODE = '57' // Colombia — la operación del piloto

// Deja sólo dígitos y le pone indicativo si el usuario escribió el número
// nacional. Acepta lo que la gente realmente teclea: `320 123 4567`,
// `+57 320 123 4567`, `0057…`, con guiones o paréntesis.
export function normalizePhone(input: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  let digits = input.replace(/\D/g, '')

  // Prefijo internacional marcado como 00 (común al copiar de contactos).
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (!digits) return ''
  // Ya trae indicativo → se respeta tal cual.
  if (digits.startsWith(countryCode)) return digits
  // Número nacional (Colombia: móvil de 10 dígitos) → se le antepone.
  return `${countryCode}${digits}`
}

// Un móvil colombiano normalizado son 12 dígitos: 57 + 10. Se valida el caso
// del país del piloto y se deja pasar cualquier otro indicativo con largo
// plausible, para no bloquear a un conductor extranjero.
export function isValidPhone(normalized: string): boolean {
  if (!/^\d+$/.test(normalized)) return false
  if (normalized.startsWith(DEFAULT_COUNTRY_CODE)) return normalized.length === 12
  return normalized.length >= 8 && normalized.length <= 15
}

// Para mostrar: `573229596618` → `+57 322 959 6618`. Nunca para enviar.
export function formatPhoneDisplay(normalized: string): string {
  if (!normalized) return ''
  if (normalized.startsWith(DEFAULT_COUNTRY_CODE) && normalized.length === 12) {
    const n = normalized.slice(2)
    return `+57 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
  }
  return `+${normalized}`
}

// Para enlaces `tel:` — ahí el `+` sí va, es lo que espera el marcador.
export function toTelHref(normalized: string): string {
  return `tel:+${normalized}`
}
