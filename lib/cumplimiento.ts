// Cálculo del cumplimiento — la aritmética del informe que hoy se saca a mano
// filtrando Excel. Vive aquí y no en `queries/` a propósito: no importa nada de
// red, así se puede probar. Es exactamente el tipo de lógica que se rompe en
// SILENCIO — un porcentaje mal calculado se ve idéntico a uno bien calculado, y
// este va en un informe que se le entrega al cliente.
//
// DOS DECISIONES QUE NO SON OBVIAS:
//
// 1) El % se calcula SOLO sobre entregas con `fechaProgramada`, y el informe
//    DECLARA cuántas quedaron fuera (`sinCompromiso`). Una base recortada en
//    silencio es peor que no tener el dato: se ve igual de buena.
//
// 2) "A tiempo" se compara a nivel de FECHA, no de hora. El compromiso que manda
//    el cliente es un día ("programada para el 25"), no una hora. Las cadenas sí
//    tienen ventana de recibo (7-11am), pero esa ventana no está en el schema y
//    no se inventa aquí.
import type { EstadoEntrega, TipoNovedad } from '@/types'

export interface EntregaInforme {
  /** Número de factura del generador de carga: la llave con la que el cliente
   *  cuadra el informe contra su propio Excel. */
  factura: string | null
  /** Segunda fecha tras una novedad ("2DA FECHA" en el archivo del cliente).
   *  NUNCA sustituye a `fechaProgramada` en el cálculo — ver `aTiempo` abajo:
   *  la dueña confirmó que el cumplimiento se mide SIEMPRE contra la primera,
   *  la de la malla. Se expone sólo para poder analizar causas de reprogramación. */
  fechaReprogramada: string | null
  /** Quién entregó. El cliente lo pide en su formato ("¿qué carro lo entregó?"). */
  conductor: string | null
  tienda: string
  ciudad: string
  estado: EstadoEntrega
  fechaProgramada: string | null
  fechaEntrega: string | null
  novedad: TipoNovedad | null
  observaciones: string | null
  /** La foto de la factura firmada, si ya volvió. Null = todavía no llega —
   *  esto es LITERALMENTE lo que Girle persigue con el cuaderno físico. */
  fotoCumplidoUrl: string | null
}

/**
 * Estado del CUMPLIDO — distinto del estado de la ENTREGA.
 *
 * El archivo real del cliente separa dos preguntas que en nuestro schema
 * quedaban mezcladas en una sola columna `estado`: "¿llegó la mercancía?"
 * (ESTATUS) y "¿ya volvió el papel firmado?" (CUMPLIDO). Una entrega puede
 * estar ENTREGADA y con el cumplido PENDIENTE durante 15-20 días — es
 * exactamente el cuello de botella que este producto existe para cerrar.
 *
 * `null` cuando la entrega ni siquiera se hizo: la pregunta "¿volvió el papel?"
 * no aplica todavía.
 */
export function estadoCumplido(e: Pick<EntregaInforme, 'estado' | 'fotoCumplidoUrl'>): 'ENTREGADO' | 'PENDIENTE' | null {
  if (e.estado !== 'entregado') return null
  return e.fotoCumplidoUrl ? 'ENTREGADO' : 'PENDIENTE'
}

export interface Cumplimiento {
  total: number
  conCompromiso: number
  sinCompromiso: number
  entregadas: number
  aTiempo: number
  tarde: number
  novedades: number
  /** null cuando no hay ninguna entrega con compromiso: no hay contra qué medir. */
  pctCumplimiento: number | null
  pctEfectividad: number | null
  porNovedad: { tipo: TipoNovedad; n: number }[]
  porCiudad: { ciudad: string; total: number; aTiempo: number; novedades: number }[]
}

function pct(parte: number, total: number): number | null {
  return total === 0 ? null : Math.round((parte / total) * 1000) / 10
}

export function calcularCumplimiento(entregas: EntregaInforme[]): Cumplimiento {
  const conCompromiso = entregas.filter((e) => e.fechaProgramada !== null)
  const entregadas = entregas.filter((e) => e.estado === 'entregado')
  const novedades = entregas.filter((e) => e.estado === 'novedad')

  const aTiempo = conCompromiso.filter(
    (e) => e.estado === 'entregado' && e.fechaEntrega !== null && e.fechaEntrega <= e.fechaProgramada!
  )

  const porNovedad = new Map<TipoNovedad, number>()
  for (const e of novedades) {
    if (e.novedad) porNovedad.set(e.novedad, (porNovedad.get(e.novedad) ?? 0) + 1)
  }

  const porCiudad = new Map<string, { ciudad: string; total: number; aTiempo: number; novedades: number }>()
  for (const e of entregas) {
    const fila = porCiudad.get(e.ciudad) ?? { ciudad: e.ciudad, total: 0, aTiempo: 0, novedades: 0 }
    fila.total += 1
    if (e.estado === 'novedad') fila.novedades += 1
    if (aTiempo.includes(e)) fila.aTiempo += 1
    porCiudad.set(e.ciudad, fila)
  }

  return {
    total: entregas.length,
    conCompromiso: conCompromiso.length,
    sinCompromiso: entregas.length - conCompromiso.length,
    entregadas: entregadas.length,
    aTiempo: aTiempo.length,
    tarde: entregadas.length - aTiempo.length,
    novedades: novedades.length,
    pctCumplimiento: pct(aTiempo.length, conCompromiso.length),
    pctEfectividad: pct(entregadas.length, entregas.length),
    porNovedad: [...porNovedad.entries()]
      .map(([tipo, n]) => ({ tipo, n }))
      .sort((a, b) => b.n - a.n),
    porCiudad: [...porCiudad.values()].sort((a, b) => b.novedades - a.novedades || b.total - a.total),
  }
}
