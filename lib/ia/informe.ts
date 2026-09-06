// Quién redacta el informe — Claude por defecto, Gemini como respaldo temporal.
//
// POR QUÉ DOS PROVEEDORES: el pago en la consola de Anthropic quedó trabado
// (fallo de 3D Secure con dos tarjetas distintas, varios días seguidos). Gemini
// tiene un tier gratis real — sin tarjeta, sin vencimiento — que permite seguir
// probando la app mientras eso se resuelve. Se elige por variable de entorno,
// no por parámetro: el día que vuelva `ANTHROPIC_API_KEY`, Claude se prefiere
// solo, sin tocar código en ningún lado.
//
// NO SON INTERCAMBIABLES EN CALIDAD. Gemini Flash es el modelo gratuito; sirve
// para probar la app de punta a punta, no para confiar el copiloto en
// producción sin volver a medir con Opus 5 cuando el pago se resuelva.
//
// Los NÚMEROS del informe los calcula `lib/cumplimiento.ts`, nunca el modelo —
// eso no cambia con el proveedor. Este módulo sólo redacta el texto.
//
// Dos esquemas y no uno: Gemini usa un dialecto de JSON Schema distinto al de
// Claude (tipos en MAYÚSCULA, `nullable: true` en vez de `type: [x, "null"]"`,
// sin `additionalProperties`) — compartir un solo objeto habría significado
// escribirlo para el mínimo común, perdiendo precisión en ambos.
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import type { Cumplimiento, EntregaInforme } from '@/lib/cumplimiento'

// El SDK de Gemini stringifica sus errores como `ApiError: {json crudo}` — sin
// esto ese JSON completo se ve tal cual en la tabla de /dashboard/cumplidos,
// donde lo lee Girle. Se extrae sólo `.error.message` cuando se puede.
function mensajeGemini(e: unknown): string {
  const bruto = e instanceof Error ? e.message : String(e)
  try {
    return JSON.parse(bruto)?.error?.message ?? bruto
  } catch {
    return bruto
  }
}

export interface Analisis {
  resumen: string
  hallazgos: string[]
  oportunidades: { texto: string; dependeDe: 'nosotros' | 'cliente' | 'punto' }[]
}

const SISTEMA = `Eres analista de operación de una transportadora colombiana. Redactas el informe
semanal de cumplimiento que la empresa le entrega a su cliente (el generador de carga).

QUIÉN LO LEE: el cliente que contrató el transporte. No es un informe interno.

REGLA INVIOLABLE: usa ÚNICAMENTE las cifras del JSON que recibes. No calcules,
no estimes, no redondees a un número distinto, no infieras tendencias de
semanas anteriores (no las tienes). Si algo no se puede afirmar con los datos
dados, no lo afirmes. Un número inventado aquí llega a la mesa de un cliente.

CÓMO ATRIBUIR: cada oportunidad de mejora dice de quién depende resolverla:
  · "nosotros"  — la transportadora (ruteo, tiempos, coordinación)
  · "cliente"   — el generador de carga (facturas erradas, órdenes de compra cerradas)
  · "punto"     — la tienda destino (colas de descargue, horarios, inventarios)
Si los datos no permiten atribuirla con confianza, dilo en el texto en vez de adivinar.

VOCABULARIO: cumplido, novedad, punto, generador de carga, ventana de recibo.
TONO: profesional y directo. Sin relleno, sin disculpas, sin "esperamos que".
Si el cumplimiento fue bueno, dilo sin adornarlo.`

const ESQUEMA_CLAUDE = {
  type: 'object',
  properties: {
    resumen: {
      type: 'string',
      description: 'Un párrafo, máximo 60 palabras, dirigido al cliente. Lo primero que lee.',
    },
    hallazgos: {
      type: 'array',
      items: { type: 'string' },
      description: 'Qué pasó esta semana. Entre 2 y 4, una frase cada uno.',
    },
    oportunidades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          texto: { type: 'string' },
          dependeDe: { type: 'string', enum: ['nosotros', 'cliente', 'punto'] },
        },
        required: ['texto', 'dependeDe'],
        additionalProperties: false,
      },
      description: 'Entre 1 y 3. Cada una dice de quién depende corregirla.',
    },
  },
  required: ['resumen', 'hallazgos', 'oportunidades'],
  additionalProperties: false,
} as const

const ESQUEMA_GEMINI = {
  type: 'OBJECT',
  properties: {
    resumen: { type: 'STRING' },
    hallazgos: { type: 'ARRAY', items: { type: 'STRING' } },
    oportunidades: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          texto: { type: 'STRING' },
          dependeDe: { type: 'STRING', enum: ['nosotros', 'cliente', 'punto'] },
        },
        required: ['texto', 'dependeDe'],
      },
    },
  },
  required: ['resumen', 'hallazgos', 'oportunidades'],
}

function armarPrompt(
  cumplimiento: Cumplimiento,
  entregas: EntregaInforme[],
  desde: string,
  hasta: string
): string {
  const problema = entregas.filter(
    (e) =>
      e.estado === 'novedad' ||
      (e.fechaEntrega && e.fechaProgramada && e.fechaEntrega > e.fechaProgramada)
  )
  return (
    `Semana del ${desde} al ${hasta}.\n\n` +
    `Totales ya calculados (NO los recalcules):\n${JSON.stringify(cumplimiento, null, 2)}\n\n` +
    `Detalle de las entregas con novedad o fuera de fecha:\n${JSON.stringify(problema, null, 2)}`
  )
}

export async function redactarInforme(
  cumplimiento: Cumplimiento,
  entregas: EntregaInforme[],
  desde: string,
  hasta: string
): Promise<{ analisis: Analisis | null; error?: string }> {
  const prompt = armarPrompt(cumplimiento, entregas, desde, hasta)

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const respuesta = await new Anthropic().messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        system: SISTEMA,
        output_config: { format: { type: 'json_schema', schema: ESQUEMA_CLAUDE } },
        messages: [{ role: 'user', content: prompt }],
      })
      const bloque = respuesta.content.find((b) => b.type === 'text')
      return { analisis: bloque ? JSON.parse(bloque.text) : null }
    } catch (e) {
      const detalle = e instanceof Anthropic.APIError ? `${e.status}: ${e.message}` : String(e)
      console.error('Fallo redactando el informe con Claude:', detalle)
      return { analisis: null, error: detalle }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const respuesta = await ai.models.generateContent({
        model: 'gemini-3.6-flash', // '2.5' quedó retirado para cuentas nuevas — ver STATUS.md 2026-09-06
        contents: prompt,
        config: {
          systemInstruction: SISTEMA,
          responseMimeType: 'application/json',
          responseSchema: ESQUEMA_GEMINI,
        },
      })
      return { analisis: respuesta.text ? JSON.parse(respuesta.text) : null }
    } catch (e) {
      console.error('Fallo redactando el informe con Gemini:', mensajeGemini(e))
      return { analisis: null, error: mensajeGemini(e) }
    }
  }

  return { analisis: null, error: 'Falta ANTHROPIC_API_KEY o GEMINI_API_KEY en el servidor.' }
}
