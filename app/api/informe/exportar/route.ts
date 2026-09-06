// Descarga el informe en el formato exacto que Casablanca espera — listo para
// que se suba de un solo movimiento, no como referencia para transcribir.
//
// Vive separado de /api/informe: ese redacta con IA (necesita la llave, puede
// fallar, cuesta centavos); esto sólo formatea datos ya calculados y no toca el
// modelo. Un fallo de saldo de API no debería tumbar la descarga del Excel.
import ExcelJS from 'exceljs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { entregasDelInforme } from '@/lib/queries/reporte'
import { ENCABEZADOS_CASABLANCA, filasCasablanca, tituloCasablanca } from '@/lib/exportadores/casablanca'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FECHA = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
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

  const params = new URL(request.url).searchParams
  const clienteId = params.get('clienteId')
  const desde = params.get('desde')
  const hasta = params.get('hasta')
  if (
    !clienteId || !UUID.test(clienteId) ||
    !desde || !FECHA.test(desde) ||
    !hasta || !FECHA.test(hasta) ||
    desde > hasta
  ) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  let entregas
  try {
    entregas = await entregasDelInforme(db, clienteId, desde, hasta)
  } catch (e) {
    console.error('Fallo cargando las entregas para exportar:', e)
    return NextResponse.json({ error: 'No se pudieron cargar las entregas.' }, { status: 502 })
  }
  if (entregas.length === 0) {
    return NextResponse.json({ error: 'No hay entregas en ese rango.' }, { status: 404 })
  }

  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Entregas')

  const titulo = tituloCasablanca(entregas)
  hoja.mergeCells(1, 1, 1, ENCABEZADOS_CASABLANCA.length)
  const celdaTitulo = hoja.getCell(1, 1)
  celdaTitulo.value = titulo
  celdaTitulo.font = { bold: true }
  celdaTitulo.alignment = { horizontal: 'center' }

  const filaEncabezado = hoja.addRow([...ENCABEZADOS_CASABLANCA])
  filaEncabezado.font = { bold: true }
  filaEncabezado.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })

  for (const fila of filasCasablanca(entregas)) {
    const r = hoja.addRow([
      fila.numeroDocumento, fila.ciudad, fila.diaEntrega, fila.fechaProgramEntrega,
      fila.segundaFecha, fila.fechaEntrega, fila.estatus, fila.cumplido, fila.observaciones,
    ])
    // Mismo código de color que el archivo real: amarillo cuando hubo
    // reprogramación — sigue siendo un incumplimiento para el cliente, no un
    // borrón y cuenta nueva.
    if (fila.segundaFecha) {
      r.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
      })
    }
  }

  hoja.columns.forEach((col) => {
    col.width = 20
  })

  const buffer = await libro.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${titulo}.xlsx"`,
    },
  })
}
