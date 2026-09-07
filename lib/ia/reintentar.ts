// Reintento con backoff para llamadas a Gemini.
//
// POR QUÉ EXISTE: el QA de 2026-09-07 subió el lote real de 23 facturas y
// 18 terminaron en error de API — no por mala letra ni mal OCR. Causa: el
// tier gratis de gemini-3.6-flash tiene un tope bajo de llamadas, y sin
// reintento, cualquier bache (cuota momentánea o sobrecarga) tumbaba esa
// página para siempre. Sin esto, la tasa de confirmación sin corrección de
// Fase 3.2 (la métrica que decide cuándo se quita el humano) no se puede
// medir sobre un lote completo — cada corrida se caía a mitad de camino.
//
// Respeta el `retryDelay` que Google manda en el propio error (RetryInfo) en
// vez de adivinar cuánto esperar; si no viene, usa backoff exponencial.
//
// NO ES UNA SOLUCIÓN A UN TOPE DIARIO AGOTADO. Reintentar dentro del mismo
// día no fabrica más cuota — sólo absorbe baches transitorios (un 503 de
// "alta demanda", un pico de 429 momentáneo). Si el lote sigue fallando
// después de 3 intentos espaciados, es que la cuota del día ya se acabó, y
// eso se arregla pagando Gemini o destrabando el pago de Anthropic, no con
// más reintentos. (El SDK de Anthropic ya reintenta 429/5xx por su cuenta —
// esto es específico de Gemini.)

function extraerErrorGoogle(e: unknown): { code?: number; retryDelayMs?: number } | null {
  const bruto = e instanceof Error ? e.message : String(e)
  try {
    const parsed = JSON.parse(bruto)
    const code: number | undefined = parsed?.error?.code
    const detalles: unknown[] = parsed?.error?.details ?? []
    const retryInfo = detalles.find(
      (d): d is { retryDelay: string } =>
        typeof d === 'object' && d !== null &&
        String((d as Record<string, unknown>)['@type'] ?? '').includes('RetryInfo')
    )
    const retryDelayMs = retryInfo ? Math.round(parseFloat(retryInfo.retryDelay) * 1000) : undefined
    return { code, retryDelayMs }
  } catch {
    return null
  }
}

function esReintentable(e: unknown): boolean {
  const info = extraerErrorGoogle(e)
  // 429 = cuota/velocidad agotada momentáneamente, 503 = sobrecarga temporal.
  // Todo lo demás (400 esquema mal formado, 404 modelo inexistente, 403
  // permiso) da la MISMA respuesta en el siguiente intento — reintentar ahí
  // sólo quema tiempo y, peor, más cuota.
  return info?.code === 429 || info?.code === 503
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Reintenta `llamar` hasta 3 veces ante 429/503 de Gemini, respetando el
 * `retryDelay` de Google cuando viene; si no, backoff exponencial (1s, 2s).
 * Cualquier otro error (o el tercer intento) se propaga tal cual.
 */
export async function conReintentoGemini<T>(llamar: () => Promise<T>): Promise<T> {
  const INTENTOS = 3
  for (let intento = 0; intento < INTENTOS; intento++) {
    try {
      return await llamar()
    } catch (e) {
      if (intento === INTENTOS - 1 || !esReintentable(e)) throw e
      const espera = extraerErrorGoogle(e)?.retryDelayMs ?? 2 ** intento * 1000
      await dormir(Math.min(espera, 30_000))
    }
  }
  throw new Error('inalcanzable') // TS no sabe que el for siempre retorna o lanza
}
