// Quién lee el cumplido — Claude por defecto, Gemini como respaldo temporal.
// Ver `lib/ia/informe.ts` para el porqué de los dos proveedores y por qué hay
// dos esquemas (dialectos de JSON Schema distintos, no comparten objeto).
//
// AQUÍ LA ELECCIÓN DE PROVEEDOR PESA MÁS: leer un sello de caucho manuscrito es
// una tarea de VISIÓN, y es justo el caso difícil que este proyecto está
// validando. Gemini Flash permite probar la app entera sin gastar nada; no
// permite todavía confiar el % de aciertos — eso se mide con Opus 5 cuando el
// pago se resuelva, antes de apostarle a estos números en producción.
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'

export interface ExtraidoCumplido {
  numero_factura: string | null
  punto_entrega: string | null
  fecha_entrega: string | null
  confianza_fecha: 'alta' | 'media' | 'baja'
  hora_entrega: string | null
  recibido_por: string | null
  novedad: { tipo: string; descripcion: string } | null
}

const SISTEMA = `Lees cumplidos de entrega de una transportadora colombiana: facturas de venta
impresas que fueron entregadas en un punto y selladas a mano al recibirlas.

ESTRUCTURA DEL DOCUMENTO
· Arriba, IMPRESO: el número de factura (grande, junto al título), el emisor, el adquiriente y el
  "Pto. Envío" (el punto físico donde se entregó).
· Abajo, un SELLO DE CAUCHO tipo "RECIBO DE MERCANCÍA" relleno A MANO con: quién recibe, cédula,
  fecha (día / mes / año en casillas separadas), hora, y una firma.

EL SELLO CAMBIA EN CADA PUNTO: distinta posición en la hoja, distinta nitidez — a veces la plantilla
está casi borrada y sólo se lee la letra manuscrita encima. Búscalo en toda la página, no en un
lugar fijo.

REGLA PRINCIPAL: **null vale más que un dato inventado.** Un número mal leído aquí se convierte en
una entrega marcada tarde que llegó a tiempo, o al revés, y eso termina en un informe que se le
entrega al cliente. Si un campo está vacío, tachado o no lo puedes leer con seguridad, devuelve null
y baja la confianza. Nadie te va a reprochar un null; una fecha inventada sí rompe algo.

FECHAS: el sello trae día, mes y año en casillas, con el año en dos dígitos ("11 08 26" = 2026-08-11).
Devuélvela siempre como YYYY-MM-DD. Ojo: la "FECHA EMISIÓN" impresa arriba NO es la fecha de entrega
— suelen diferir varios días. La que importa es la manuscrita.

NOVEDAD: sólo si hay una anotación de faltante, rechazo o daño (a veces escrita al margen o sobre el
detalle). Una entrega sin anotaciones NO tiene novedad: devuelve null.`

const ESQUEMA_CLAUDE = {
  type: 'object',
  properties: {
    numero_factura: {
      type: ['string', 'null'],
      description: 'Número IMPRESO de la factura, como aparece (ej. "FEV76883"). null si no se lee.',
    },
    punto_entrega: {
      type: ['string', 'null'],
      description: 'El "Pto. Envío" impreso, o el nombre del punto en el sello.',
    },
    fecha_entrega: {
      type: ['string', 'null'],
      description:
        'Fecha MANUSCRITA del sello de recibo, en formato YYYY-MM-DD. El año suele venir de dos ' +
        'dígitos ("26" = 2026). null si está vacía o ilegible — null es preferible a adivinar.',
    },
    confianza_fecha: {
      type: 'string',
      enum: ['alta', 'media', 'baja'],
      description: 'Qué tan legible estaba la fecha manuscrita. Es el campo que decide el cumplimiento.',
    },
    hora_entrega: { type: ['string', 'null'], description: 'Hora manuscrita HH:MM, o null.' },
    recibido_por: { type: ['string', 'null'], description: 'Nombre manuscrito de quien recibe, o null.' },
    novedad: {
      type: ['object', 'null'],
      description: 'Sólo si hay una anotación de faltante, rechazo o daño. Si todo llegó bien: null.',
      properties: {
        tipo: {
          type: 'string',
          enum: ['rechazo', 'faltante', 'danado', 'cliente_ausente', 'direccion_errada', 'otro'],
        },
        descripcion: { type: 'string' },
      },
      required: ['tipo', 'descripcion'],
      additionalProperties: false,
    },
  },
  required: [
    'numero_factura', 'punto_entrega', 'fecha_entrega',
    'confianza_fecha', 'hora_entrega', 'recibido_por', 'novedad',
  ],
  additionalProperties: false,
} as const

const ESQUEMA_GEMINI = {
  type: 'OBJECT',
  properties: {
    numero_factura: { type: 'STRING', nullable: true },
    punto_entrega: { type: 'STRING', nullable: true },
    fecha_entrega: { type: 'STRING', nullable: true },
    confianza_fecha: { type: 'STRING', enum: ['alta', 'media', 'baja'] },
    hora_entrega: { type: 'STRING', nullable: true },
    recibido_por: { type: 'STRING', nullable: true },
    novedad: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        tipo: {
          type: 'STRING',
          enum: ['rechazo', 'faltante', 'danado', 'cliente_ausente', 'direccion_errada', 'otro'],
        },
        descripcion: { type: 'STRING' },
      },
      required: ['tipo', 'descripcion'],
    },
  },
  required: [
    'numero_factura', 'punto_entrega', 'fecha_entrega',
    'confianza_fecha', 'hora_entrega', 'recibido_por', 'novedad',
  ],
}

const INSTRUCCION = 'Extrae los datos de este cumplido.'

export async function leerCumplido(
  imagenBase64: string,
  mimeType = 'image/jpeg'
): Promise<{ extraido: ExtraidoCumplido | null; error?: string }> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const respuesta = await new Anthropic().messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        system: SISTEMA,
        output_config: { format: { type: 'json_schema', schema: ESQUEMA_CLAUDE } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagenBase64 } },
              { type: 'text', text: INSTRUCCION },
            ],
          },
        ],
      })
      const bloque = respuesta.content.find((b) => b.type === 'text')
      return { extraido: bloque ? JSON.parse(bloque.text) : null }
    } catch (e) {
      const detalle = e instanceof Anthropic.APIError ? `${e.status}: ${e.message}` : String(e)
      console.error('Fallo leyendo el cumplido con Claude:', detalle)
      return { extraido: null, error: detalle }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const respuesta = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ inlineData: { mimeType, data: imagenBase64 } }, { text: INSTRUCCION }],
          },
        ],
        config: {
          systemInstruction: SISTEMA,
          responseMimeType: 'application/json',
          responseSchema: ESQUEMA_GEMINI,
        },
      })
      return { extraido: respuesta.text ? JSON.parse(respuesta.text) : null }
    } catch (e) {
      console.error('Fallo leyendo el cumplido con Gemini:', String(e))
      return { extraido: null, error: String(e) }
    }
  }

  return { extraido: null, error: 'Falta ANTHROPIC_API_KEY o GEMINI_API_KEY en el servidor.' }
}
