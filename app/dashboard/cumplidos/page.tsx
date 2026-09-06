'use client'

// Lectura del lote de cumplidos — el trabajo que hoy se hace abriendo un PDF de
// 23 facturas selladas a mano y transcribiéndolas una por una.
//
// ALCANCE DELIBERADO: esta pantalla LEE Y PROPONE. Todavía no cierra entregas.
// Lo desconocido del proyecto era si el modelo puede leer un sello de caucho
// relleno a mano; el paso de escritura es mecánico y se cablea cuando la calidad
// de la lectura esté medida sobre lotes reales, no antes.
//
// EL PDF SE PARTE EN EL NAVEGADOR: 23 páginas × una llamada al modelo no cabe en
// el timeout de una función serverless. Una página por request, con progreso real.
import { useState } from 'react'
import { FileUp, Loader2, TriangleAlert, CircleCheck, CircleHelp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { extraerPaginasJpeg } from '@/lib/cumplidos'
import type { ExtraidoCumplido as Extraido } from '@/lib/ia/cumplido'

interface Entrega {
  id: string
  address: string
  city: string
  fecha_programada: string | null
  numero_factura: string | null
}
interface Fila {
  pagina: number
  extraido?: Extraido
  entrega?: Entrega | null
  error?: string
}

const CONFIANZA = {
  alta: { label: 'Alta', tone: 'success' as const },
  media: { label: 'Revisar', tone: 'warning' as const },
  baja: { label: 'Dudosa', tone: 'danger' as const },
}

export default function CumplidosPage() {
  const [filas, setFilas] = useState<Fila[]>([])
  const [total, setTotal] = useState(0)
  const [leyendo, setLeyendo] = useState(false)

  async function alSubir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setLeyendo(true)
    setFilas([])

    const paginas = extraerPaginasJpeg(new Uint8Array(await archivo.arrayBuffer()))
    setTotal(paginas.length)

    // Secuencial a propósito: es un lote semanal, no una ruta caliente. En serie
    // el progreso es honesto y no hay ráfaga de peticiones contra el modelo.
    for (let i = 0; i < paginas.length; i++) {
      const cuerpo = new FormData()
      cuerpo.append('pagina', new Blob([paginas[i]], { type: 'image/jpeg' }), `p${i + 1}.jpg`)
      try {
        const r = await fetch('/api/cumplidos', { method: 'POST', body: cuerpo })
        const json = await r.json()
        setFilas((f) => [...f, { pagina: i + 1, ...json }])
      } catch (err) {
        setFilas((f) => [
          ...f,
          { pagina: i + 1, error: err instanceof Error ? err.message : 'Falló la lectura' },
        ])
      }
    }
    setLeyendo(false)
    e.target.value = ''
  }

  const conMatch = filas.filter((f) => f.entrega).length
  const sinFecha = filas.filter((f) => f.extraido && !f.extraido.fecha_entrega).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cumplidos"
        subtitle="Sube el PDF escaneado del lote. Se lee una página por factura."
      />

      <Card className="flex flex-row flex-wrap items-center gap-4 p-4">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
          <FileUp className="size-4" />
          {leyendo ? 'Leyendo…' : 'Subir PDF del lote'}
          <input type="file" accept="application/pdf" onChange={alSubir} disabled={leyendo} hidden />
        </label>
        {total > 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            {leyendo && <Loader2 className="size-4 animate-spin" />}
            {filas.length} de {total} páginas
            {!leyendo && ` · ${conMatch} emparejadas · ${sinFecha} sin fecha legible`}
          </span>
        )}
      </Card>

      {filas.length === 0 && !leyendo && (
        <EmptyState
          icon={FileUp}
          title="Ningún lote cargado"
          message="El PDF de CamScanner trae una factura sellada por página. Se parte aquí mismo, sin subirlo entero a ningún lado."
        />
      )}

      {filas.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Punto</TableHead>
                <TableHead>Entregada</TableHead>
                <TableHead>Recibió</TableHead>
                <TableHead>Novedad</TableHead>
                <TableHead>Entrega en el sistema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.pagina}>
                  <TableCell className="font-mono text-[13px] text-faint">{f.pagina}</TableCell>
                  {f.error || !f.extraido ? (
                    <TableCell colSpan={6} className="text-sm text-destructive">
                      <TriangleAlert className="mr-1 inline size-4" />
                      {f.error ?? 'Sin lectura'}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className="font-mono text-[13px]">
                        {f.extraido.numero_factura ?? '—'}
                      </TableCell>
                      <TableCell>{f.extraido.punto_entrega ?? '—'}</TableCell>
                      <TableCell>
                        <span className="font-mono text-[13px]">
                          {f.extraido.fecha_entrega ?? '—'}
                        </span>
                        {f.extraido.hora_entrega && (
                          <span className="ml-1 text-faint">{f.extraido.hora_entrega}</span>
                        )}
                        <StatusBadge
                          tone={CONFIANZA[f.extraido.confianza_fecha].tone}
                          className="ml-2"
                        >
                          {CONFIANZA[f.extraido.confianza_fecha].label}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{f.extraido.recibido_por ?? '—'}</TableCell>
                      <TableCell>
                        {f.extraido.novedad ? (
                          <StatusBadge tone="danger">{f.extraido.novedad.tipo}</StatusBadge>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {f.entrega ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px]">
                            <CircleCheck className="size-4 text-brand-ink" />
                            {f.entrega.address}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                            <CircleHelp className="size-4" />
                            sin emparejar
                          </span>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filas.length > 0 && !leyendo && (
        <p className="text-[13px] text-muted-foreground">
          Esta pantalla todavía no cierra entregas: sólo lee y propone. El cierre se cablea cuando la
          calidad de la lectura esté medida sobre lotes reales.
        </p>
      )}
    </div>
  )
}
