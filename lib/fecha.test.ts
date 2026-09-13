import { describe, it, expect } from 'vitest'
import { diaSemanaEs, fechaLargaEs, fechaCortaEs } from './fecha'

describe('formato de fecha para el archivo del cliente', () => {
  it('da el día de semana correcto sin corrimiento de zona horaria', () => {
    // 2026-08-20 es jueves. Parsear con `new Date('2026-08-20')` y leer con
    // getters LOCALES da miércoles en cualquier huso al oeste de UTC — el bug
    // exacto que estas funciones existen para evitar.
    expect(diaSemanaEs('2026-08-20')).toBe('JUEVES')
    expect(diaSemanaEs('2026-08-24')).toBe('LUNES')
  })

  it('arma el título largo como lo escribe el cliente', () => {
    expect(fechaLargaEs('2026-08-20')).toBe('20 DE AGOSTO 2026')
  })

  it('da la fecha corta sin ceros a la izquierda, como el archivo real', () => {
    expect(fechaCortaEs('2026-08-20')).toBe('20/8/2026')
    expect(fechaCortaEs('2026-01-05')).toBe('5/1/2026')
  })
})
