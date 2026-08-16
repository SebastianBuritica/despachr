import { describe, expect, it } from 'vitest'
import { formatPhoneDisplay, isValidPhone, normalizePhone, toTelHref } from '@/lib/phone'

// El número del usuario solo-teléfono que existe en producción (creado al
// verificar el OTP en el PR #19). Es el formato exacto que guarda GoTrue:
// dígitos, sin el `+`. Si esta constante deja de cuadrar, el login por OTP
// falla de forma opaca — por eso es el caso de referencia.
const CANONICO = '573229596618'

describe('normalizePhone', () => {
  it.each([
    ['nacional a 10 dígitos', '3229596618'],
    ['con espacios', '322 959 6618'],
    ['E.164 con espacios', '+57 322 959 6618'],
    ['E.164 pegado', '+573229596618'],
    ['ya canónico', '573229596618'],
    ['prefijo 00', '0057 322 959 6618'],
    ['con paréntesis y guion', '(322) 959-6618'],
  ])('%s → canónico', (_caso, input) => {
    expect(normalizePhone(input)).toBe(CANONICO)
  })

  it('cadena vacía o sin dígitos → vacío (no inventa un indicativo suelto)', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('   ')).toBe('')
    expect(normalizePhone('sin números')).toBe('')
  })

  it('respeta otro indicativo de país', () => {
    expect(normalizePhone('+1 415 555 0100', '1')).toBe('14155550100')
  })
})

describe('isValidPhone', () => {
  it('acepta el móvil colombiano completo (57 + 10 dígitos)', () => {
    expect(isValidPhone(CANONICO)).toBe(true)
  })

  it('rechaza un colombiano incompleto o de más', () => {
    expect(isValidPhone('57322959661')).toBe(false) // 11
    expect(isValidPhone('5732295966189')).toBe(false) // 13
  })

  it('rechaza vacío y cualquier cosa que no sean dígitos', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('+573229596618')).toBe(false) // el `+` NO va en canónico
    expect(isValidPhone('57 322 959 6618')).toBe(false)
  })

  it('deja pasar otros indicativos con largo plausible (no bloquea a un extranjero)', () => {
    expect(isValidPhone('14155550100')).toBe(true)
    expect(isValidPhone('1234567')).toBe(false) // demasiado corto
  })
})

describe('presentación', () => {
  it('formatPhoneDisplay agrupa el colombiano y le pone el +', () => {
    expect(formatPhoneDisplay(CANONICO)).toBe('+57 322 959 6618')
  })

  it('formatPhoneDisplay cae a +dígitos para otros indicativos', () => {
    expect(formatPhoneDisplay('14155550100')).toBe('+14155550100')
    expect(formatPhoneDisplay('')).toBe('')
  })

  it('toTelHref sí lleva el + (es lo que espera el marcador)', () => {
    expect(toTelHref(CANONICO)).toBe('tel:+573229596618')
  })

  it('un número tecleado a la ligera termina marcable', () => {
    // El caso real: `telefono_receptor` lo escribe el coordinador a mano.
    expect(toTelHref(normalizePhone('322 959 6618'))).toBe('tel:+573229596618')
  })
})
