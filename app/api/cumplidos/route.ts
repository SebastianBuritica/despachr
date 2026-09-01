// Agente 1 — CUMPLIDO. Lee una página del lote escaneado y propone el cierre.
//
// QUÉ REEMPLAZA: hoy alguien abre un PDF de 23 facturas selladas a mano, lee
// una por una, y transcribe fecha de entrega, quién recibió y novedad al Excel
// del cliente. Los cumplidos llegan 15-20 días tarde y se persiguen con un
// cuaderno.
//
// COPILOTO, NO AUTOPILOTO — y la razón es el documento, no la prudencia:
//   · Lo IMPRESO (número de factura, punto, dirección) se lee con certeza.
//   · Lo que decide el cumplimiento — la FECHA REAL DE ENTREGA — está MANUSCRITO
//     dentro de un sello de caucho que varía de posición y nitidez en cada punto.
// Por eso esto PROPONE y una persona confirma. El día que la tasa de correcciones
// caiga lo suficiente se quita el paso; esa decisión la toma el número, no la fe.
//
// NO cierra la entrega. Devuelve una propuesta. El cierre lo hace el cliente
// llamando a `confirmarCumplido`/`reportarNovedad`, que ya están probados.
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { normalizarFactura } from '@/lib/cumplidos'

const ESQUEMA = {
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

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase sin configurar.' }, { status: 503 })
  }

  const store = await cookies()
  const db = createServerClient(url, anon, {
    cookies: { getAll: () => store.getAll(), setAll: () => {} },
  })
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sin sesión.' }, { status: 401 })

  const { data: perfil } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'admin' && perfil?.role !== 'coordinador') {
    return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Falta ANTHROPIC_API_KEY en el servidor.' }, { status: 503 })
  }

  const form = await request.formData()
  const pagina = form.get('pagina')
  if (!(pagina instanceof File) || pagina.size === 0) {
    return NextResponse.json({ error: 'Falta la imagen de la página.' }, { status: 400 })
  }
  if (pagina.size > 8_000_000) {
    return NextResponse.json({ error: 'Página demasiado grande.' }, { status: 413 })
  }

  const base64 = Buffer.from(await pagina.arrayBuffer()).toString('base64')

  let extraido
  try {
    const respuesta = await new Anthropic().messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SISTEMA,
      output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Extrae los datos de este cumplido.' },
          ],
        },
      ],
    })
    const texto = respuesta.content.find((b) => b.type === 'text')
    extraido = texto ? JSON.parse(texto.text) : null
  } catch (e) {
    const detalle = e instanceof Anthropic.APIError ? `${e.status}: ${e.message}` : String(e)
    console.error('Fallo leyendo el cumplido:', detalle)
    return NextResponse.json({ error: detalle }, { status: 502 })
  }

  if (!extraido) return NextResponse.json({ error: 'Sin lectura.' }, { status: 502 })

  // Emparejar por número de factura. La normalización existe porque la misma
  // factura aparece como `FEV76883` arriba y `76883` en "Notas Factura".
  const norm = normalizarFactura(extraido.numero_factura)
  let entrega = null
  if (norm) {
    const { data } = await db
      .from('deliveries')
      .select('id, address, city, estado, fecha_programada, numero_factura, clients(name)')
      .not('numero_factura', 'is', null)
    entrega =
      (data ?? []).find((d) => normalizarFactura(d.numero_factura) === norm) ?? null
  }

  return NextResponse.json({ extraido, entrega })
}
