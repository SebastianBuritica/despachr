// El formato exacto de Casablanca — deliberadamente vive AQUÍ, fuera del
// núcleo. Regla del núcleo (AGENTS.md): nada específico de un cliente entra a
// `lib/cumplimiento.ts`. El día que llegue el cliente #2 con su propio Excel,
// se agrega `lib/exportadores/<cliente>.ts` y este archivo no se toca.
//
// Reproduce el archivo real que hoy se llena a mano ("RELACION DE ENTREGAS
// <día> <fecha> CASABLANCA", columnas B-J), para que se pueda subir tal cual
// en vez de servir sólo de referencia.
import { diaSemanaEs, fechaLargaEs, fechaCortaEs } from '@/lib/fecha'
import { estadoCumplido, type EntregaInforme } from '@/lib/cumplimiento'

export interface FilaCasablanca {
  numeroDocumento: string
  ciudad: string
  diaEntrega: string
  fechaProgramEntrega: string
  segundaFecha: string
  fechaEntrega: string
  estatus: 'ENTREGADO' | 'NO ENTREGADO'
  cumplido: 'ENTREGADO' | 'PENDIENTE' | ''
  observaciones: string
}

export const ENCABEZADOS_CASABLANCA = [
  'Nro documento', 'CIUDAD', 'DIA ENTREGA', 'Fecha Program Entrega',
  '2DA FECHA', 'Fecha Entrega', 'ESTATUS', 'CUMPLIDO', 'OBSERVACIONES',
] as const

export function filasCasablanca(entregas: EntregaInforme[]): FilaCasablanca[] {
  return entregas.map((e) => ({
    numeroDocumento: e.factura ?? '',
    ciudad: e.ciudad,
    diaEntrega: e.fechaProgramada ? diaSemanaEs(e.fechaProgramada) : '',
    fechaProgramEntrega: e.fechaProgramada ? fechaCortaEs(e.fechaProgramada) : '',
    // Referencia, nunca lo que decide el cumplimiento — ver estadoCumplido.
    segundaFecha: e.fechaReprogramada ? fechaCortaEs(e.fechaReprogramada) : '',
    fechaEntrega: e.fechaEntrega ? fechaCortaEs(e.fechaEntrega) : '',
    estatus: e.estado === 'entregado' ? 'ENTREGADO' : 'NO ENTREGADO',
    cumplido: estadoCumplido(e) ?? '',
    // Texto tal como quedó registrado. No se sintetiza una observación a partir
    // de fechas: eso sería inventar el mismo tipo de dato que el agente de
    // cumplido existe para NO inventar.
    observaciones: e.observaciones ?? '',
  }))
}

/**
 * "RELACION DE ENTREGAS JUEVES 20 DE AGOSTO 2026 CASABLANCA" — como titula el
 * archivo real, cuando todas las entregas comparten una sola fecha comprometida.
 * Se deriva de las fechas REALES del lote, no del rango pedido en el filtro:
 * el filtro es por fecha de RUTA (para no esconder entregas sin compromiso, ver
 * queries/reporte.ts) y puede no coincidir con `fechaProgramada` fila por fila.
 */
export function tituloCasablanca(entregas: EntregaInforme[]): string {
  const fechas = [...new Set(entregas.map((e) => e.fechaProgramada).filter((f): f is string => f !== null))].sort()
  if (fechas.length === 0) return 'RELACION DE ENTREGAS CASABLANCA'
  if (fechas.length === 1) return `RELACION DE ENTREGAS ${diaSemanaEs(fechas[0])} ${fechaLargaEs(fechas[0])} CASABLANCA`
  return `RELACION DE ENTREGAS DEL ${fechaCortaEs(fechas[0])} AL ${fechaCortaEs(fechas[fechas.length - 1])} CASABLANCA`
}
