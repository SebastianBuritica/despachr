// El agente que redacta el informe de cumplimiento para el cliente.
//
// POR QUÉ EXISTE: hoy este análisis se hace filtrando Excel a mano antes de la
// reunión del viernes. Los NÚMEROS los calcula `lib/cumplimiento.ts` — código,
// no modelo. El modelo sólo REDACTA: resume, señala dónde se concentra el
// problema y a quién le toca corregirlo.
//
// ESA SEPARACIÓN NO ES ESTÉTICA. Este informe se le entrega al cliente que nos
// paga. Un porcentaje inventado por un modelo es una factura mal sustentada y
// una relación comercial rota. El modelo recibe los totales ya calculados y
// tiene prohibido producir cifras nuevas.
//
// Vive en el servidor porque la llave de Anthropic NO puede llegar al navegador.
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calcularCumplimiento } from '@/lib/cumplimiento'
import { entregasDelInforme } from '@/lib/queries/reporte'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FECHA = /^\d{4}-\d{2}-\d{2}$/

const ESQUEMA = {
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

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase sin configurar en el servidor.' }, { status: 503 })
  }

  // El matcher del middleware EXCLUYE /api a propósito (un 302 a /login no le
  // sirve a un fetch). La verificación va aquí, y devuelve JSON.
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

  let cuerpo: { clienteId?: unknown; desde?: unknown; hasta?: unknown }
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const { clienteId, desde, hasta } = cuerpo
  if (
    typeof clienteId !== 'string' || !UUID.test(clienteId) ||
    typeof desde !== 'string' || !FECHA.test(desde) ||
    typeof hasta !== 'string' || !FECHA.test(hasta) ||
    desde > hasta
  ) {
    return NextResponse.json(
      { error: 'Parámetros inválidos: clienteId (uuid), desde y hasta (YYYY-MM-DD).' },
      { status: 400 }
    )
  }

  const entregas = await entregasDelInforme(db, clienteId, desde, hasta)
  const cumplimiento = calcularCumplimiento(entregas)

  // Sin entregas no hay nada que redactar. Pedirle al modelo que escriba sobre
  // cero datos es exactamente cómo se produce un informe inventado.
  if (cumplimiento.total === 0) {
    return NextResponse.json({ cumplimiento, analisis: null })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { cumplimiento, analisis: null, error: 'Falta ANTHROPIC_API_KEY en el servidor.' },
      { status: 503 }
    )
  }

  const anthropic = new Anthropic()

  try {
    const respuesta = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SISTEMA,
      output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
      messages: [
        {
          role: 'user',
          content:
            `Semana del ${desde} al ${hasta}.\n\n` +
            `Totales ya calculados (NO los recalcules):\n` +
            JSON.stringify(cumplimiento, null, 2) +
            `\n\nDetalle de las entregas con novedad o fuera de fecha:\n` +
            JSON.stringify(
              entregas.filter(
                (e) =>
                  e.estado === 'novedad' ||
                  (e.fechaEntrega && e.fechaProgramada && e.fechaEntrega > e.fechaProgramada)
              ),
              null,
              2
            ),
        },
      ],
    })

    const texto = respuesta.content.find((b) => b.type === 'text')
    const analisis = texto ? JSON.parse(texto.text) : null
    return NextResponse.json({ cumplimiento, analisis })
  } catch (e) {
    // Los números son de la base y ya están bien. Que falle la redacción no
    // puede tumbar el informe: se devuelve sin análisis y la página lo dice.
    const detalle = e instanceof Anthropic.APIError ? `${e.status}: ${e.message}` : String(e)
    console.error('Fallo redactando el informe:', detalle)
    return NextResponse.json({ cumplimiento, analisis: null, error: detalle }, { status: 502 })
  }
}
