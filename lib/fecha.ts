// Fecha "hoy" en la zona de la OPERACIÓN (Colombia, sin horario de verano).
//
// Se compara contra `routes.fecha` (columna date). Usar la zona de la operación
// y no la del navegador evita dos errores reales: de noche, el desfase UTC
// mostraría la ruta del día equivocado; y una coordinadora revisando desde otro
// huso vería un día distinto al que el conductor está corriendo.
export function hoyOperacion(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

// Minutos transcurridos desde una marca ISO. Null-safe.
export function minutosDesde(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - Date.parse(iso)) / 60000)
}

// Umbral de "demasiado tiempo en un punto". Es el MISMO que usa la edge
// function check-tiempo-en-punto para alertar; si aquí dijera otra cosa, el
// tablero y las alertas se contradirían.
export const MINUTOS_EN_PUNTO_ALERTA = 60
