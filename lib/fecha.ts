// Fecha "hoy" en la zona de la OPERACIÓN (Colombia, sin horario de verano).
//
// Se compara contra `routes.fecha` (columna date). Usar la zona de la operación
// y no la del navegador evita dos errores reales: de noche, el desfase UTC
// mostraría la ruta del día equivocado; y una coordinadora revisando desde otro
// huso vería un día distinto al que el conductor está corriendo.
export function hoyOperacion(): string {
  return fechaOperacion(new Date())
}

// La FECHA calendario de un instante, en la zona de la operación. Importa para
// el informe: un cumplido de las 8:00 pm en Bogotá es 01:00 UTC del día
// siguiente, así que comparar en UTC correría la entrega un día y marcaría
// "tarde" algo que llegó a tiempo.
export function fechaOperacion(t: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(
    typeof t === 'string' ? new Date(t) : t
  )
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
