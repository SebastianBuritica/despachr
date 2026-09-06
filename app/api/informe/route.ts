// El agente que redacta el informe de cumplimiento para el cliente.
//
// POR QUÉ EXISTE: hoy este análisis se hace filtrando Excel a mano antes de la
// reunión del viernes. Los NÚMEROS los calcula `lib/cumplimiento.ts` — código,
// no modelo. El modelo sólo REDACTA. Esa separación no es estética: este
// informe se le entrega al cliente que nos paga, y un número inventado por un
// modelo es una factura mal sustentada.
//
// QUIÉN REDACTA (Claude o Gemini) vive en `lib/ia/informe.ts`, no aquí — esta
// ruta sólo hace auth, validación de parámetros, y arma la respuesta.
//
// Vive en el servidor porque ninguna llave de IA puede llegar al navegador.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calcularCumplimiento } from '@/lib/cumplimiento'
import { entregasDelInforme } from '@/lib/queries/reporte'
import { redactarInforme } from '@/lib/ia/informe'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FECHA = /^\d{4}-\d{2}-\d{2}$/

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

  // Un error de datos (RLS, un join mal escrito, un timeout) NO puede tumbar
  // la respuesta con un 500 desnudo — el QA de 2026-09-06 encontró exactamente
  // eso: el join a `drivers` estaba mal y la ruta moría sin cuerpo, silencioso.
  let entregas
  try {
    entregas = await entregasDelInforme(db, clienteId, desde, hasta)
  } catch (e) {
    console.error('Fallo cargando las entregas del informe:', e)
    return NextResponse.json(
      { cumplimiento: null, analisis: null, error: 'No se pudieron cargar las entregas.' },
      { status: 502 }
    )
  }
  const cumplimiento = calcularCumplimiento(entregas)

  // Sin entregas no hay nada que redactar. Pedirle al modelo que escriba sobre
  // cero datos es exactamente cómo se produce un informe inventado.
  if (cumplimiento.total === 0) {
    return NextResponse.json({ cumplimiento, analisis: null })
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { cumplimiento, analisis: null, error: 'Falta ANTHROPIC_API_KEY o GEMINI_API_KEY en el servidor.' },
      { status: 503 }
    )
  }

  // Los números ya están calculados y son válidos aunque la redacción falle:
  // por eso esto nunca devuelve un status de error que tumbe el informe.
  const { analisis, error } = await redactarInforme(cumplimiento, entregas, desde, hasta)
  return NextResponse.json({ cumplimiento, analisis, error })
}
