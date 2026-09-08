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
// llamando a `cerrarCumplidoDesdeExtraccion`/`cerrarNovedadDesdeExtraccion`
// (`lib/queries/coordinator.ts`) tras la confirmación humana en la pantalla —
// NO `confirmarCumplido`/`reportarNovedad` del conductor: esas registran un
// delivery_event con GPS/hora de quien confirma, y aquí quien confirma no es
// quien entregó.
//
// QUIÉN LEE (Claude o Gemini) vive en `lib/ia/cumplido.ts`, no aquí — esta ruta
// sólo hace auth, valida el archivo, y empareja la respuesta por factura.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { normalizarFactura } from '@/lib/cumplidos'
import { leerCumplido } from '@/lib/ia/cumplido'

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

  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Falta ANTHROPIC_API_KEY o GEMINI_API_KEY en el servidor.' },
      { status: 503 }
    )
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
  const { extraido, error } = await leerCumplido(base64)
  if (error) return NextResponse.json({ error }, { status: 502 })
  if (!extraido) return NextResponse.json({ error: 'Sin lectura.' }, { status: 502 })

  // Emparejar por número de factura. La normalización existe porque la misma
  // factura aparece como `FEV76883` arriba y `76883` en "Notas Factura".
  const norm = normalizarFactura(extraido.numero_factura)
  let entrega = null
  if (norm) {
    const { data } = await db
      .from('deliveries')
      .select('id, route_id, address, city, estado, fecha_programada, numero_factura, clients(name)')
      .not('numero_factura', 'is', null)
    entrega = (data ?? []).find((d) => normalizarFactura(d.numero_factura) === norm) ?? null
  }

  return NextResponse.json({ extraido, entrega })
}
