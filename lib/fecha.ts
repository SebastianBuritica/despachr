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

// --- Formato para exportar al cliente ---------------------------------------
// Operan sobre fechas YYYY-MM-DD (columnas `date`, no timestamp): parsear con
// `new Date(iso)` y leer con los getters UTC evita el corrimiento de un día
// que da leer en la zona local — el mismo error que `fechaOperacion` existe
// para evitar del lado contrario.

const DIAS_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
const MESES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
]

/** "2026-08-20" → "JUEVES". Para la columna "DIA ENTREGA" del formato del cliente. */
export function diaSemanaEs(fechaIso: string): string {
  return DIAS_ES[new Date(fechaIso + 'T00:00:00Z').getUTCDay()]
}

/** "2026-08-20" → "20 DE AGOSTO 2026". Para el título del archivo exportado. */
export function fechaLargaEs(fechaIso: string): string {
  const d = new Date(fechaIso + 'T00:00:00Z')
  return `${d.getUTCDate()} DE ${MESES_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "2026-08-20" → "20/8/2026". El formato corto que usa el archivo del cliente. */
export function fechaCortaEs(fechaIso: string): string {
  const d = new Date(fechaIso + 'T00:00:00Z')
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`
}
