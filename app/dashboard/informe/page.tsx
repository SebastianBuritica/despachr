'use client'

// Informe de cumplimiento por cliente — reemplaza el mock que había aquí.
//
// LO QUE SUSTITUYE: hoy este informe se arma llenando a mano el Excel que manda
// el generador de carga y filtrándolo antes de la reunión del viernes.
//
// DECISIÓN DE ESTRUCTURA: los NÚMEROS se cargan y calculan en el navegador y se
// pintan de inmediato. El ANÁLISIS redactado es un segundo paso, opcional y
// explícito. Si el modelo falla o no está configurado, el informe sigue en pie
// completo — sólo sin la narrativa. Al revés (números que dependen del modelo)
// sería poner una cifra que se le entrega a un cliente detrás de una llamada
// que puede fallar.
import { useCallback, useEffect, useState } from 'react'
import { Download, FileText, Sparkles, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { calcularCumplimiento, type Cumplimiento, type EntregaInforme } from '@/lib/cumplimiento'
import type { Analisis } from '@/lib/ia/informe'
import { entregasDelInforme } from '@/lib/queries/reporte'

const DEPENDE_UI = {
  nosotros: { label: 'Depende de nosotros', tone: 'warning' as const },
  cliente: { label: 'Depende del cliente', tone: 'neutral' as const },
  punto: { label: 'Depende del punto', tone: 'neutral' as const },
}

const NOVEDAD_UI: Record<string, string> = {
  rechazo: 'Rechazo',
  faltante: 'Faltante',
  danado: 'Dañado',
  cliente_ausente: 'Cliente ausente',
  direccion_errada: 'Dirección errada',
  otro: 'Otro',
}

export default function ReportesPage() {
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([])
  const [clienteId, setClienteId] = useState('')
  const [desde, setDesde] = useState('2026-08-24')
  const [hasta, setHasta] = useState('2026-08-28')

  const [entregas, setEntregas] = useState<EntregaInforme[] | null>(null)
  const [resumen, setResumen] = useState<Cumplimiento | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [redactando, setRedactando] = useState(false)
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        setClientes(data ?? [])
        if (data?.length) setClienteId((prev) => prev || data[0].id)
      })
  }, [])

  const cargar = useCallback(async () => {
    if (!clienteId) return
    setCargando(true)
    setError(null)
    setAnalisis(null)
    setErrorAnalisis(null)
    try {
      const filas = await entregasDelInforme(supabase, clienteId, desde, hasta)
      setEntregas(filas)
      setResumen(calcularCumplimiento(filas))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el informe.')
    } finally {
      setCargando(false)
    }
  }, [clienteId, desde, hasta])

  // Mismo idiom que `useCoordinadorData`: el IIFE mantiene el setState fuera
  // del cuerpo directo del efecto.
  useEffect(() => {
    void (async () => {
      await cargar()
    })()
  }, [cargar])

  async function redactar() {
    setRedactando(true)
    setErrorAnalisis(null)
    try {
      const r = await fetch('/api/informe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, desde, hasta }),
      })
      const json = await r.json()
      if (json.analisis) setAnalisis(json.analisis)
      else setErrorAnalisis(json.error ?? 'El modelo no devolvió análisis.')
    } catch (e) {
      setErrorAnalisis(e instanceof Error ? e.message : 'Falló la redacción.')
    } finally {
      setRedactando(false)
    }
  }

  const problemas = (entregas ?? []).filter(
    (e) =>
      e.estado === 'novedad' ||
      (e.fechaEntrega && e.fechaProgramada && e.fechaEntrega > e.fechaProgramada)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informe de cumplimiento"
        subtitle="Lo que se le entrega al cliente cada semana"
      />

      {/* flex-row explícito: la base de Card trae `flex flex-col`, y sin esto
          los filtros quedan en columna. */}
      <Card className="flex flex-row flex-wrap items-end gap-3 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Cliente</span>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          />
        </label>

        {/* Enlace normal, no fetch+blob: es un GET que devuelve un archivo con
            Content-Disposition — el navegador ya sabe descargarlo. */}
        {resumen && resumen.total > 0 && (
          <a
            href={`/api/informe/exportar?clienteId=${clienteId}&desde=${desde}&hasta=${hasta}`}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <Download className="size-4" />
            Descargar para Casablanca
          </a>
        )}
      </Card>

      {error && (
        <Card className="flex items-center gap-2 p-4 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </Card>
      )}

      {!cargando && resumen && resumen.total === 0 && (
        <EmptyState
          icon={FileText}
          title="Sin entregas en ese rango"
          message="No hay entregas de este cliente con rutas entre esas fechas."
        />
      )}

      {resumen && resumen.total > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Cifra
              titulo="Cumplimiento"
              valor={resumen.pctCumplimiento === null ? '—' : `${resumen.pctCumplimiento}%`}
              nota={`${resumen.aTiempo} de ${resumen.conCompromiso} a tiempo`}
            />
            <Cifra
              titulo="Entregas efectivas"
              valor={resumen.pctEfectividad === null ? '—' : `${resumen.pctEfectividad}%`}
              nota={`${resumen.entregadas} de ${resumen.total}`}
            />
            <Cifra titulo="Fuera de fecha" valor={String(resumen.tarde)} nota="entregadas tarde" />
            <Cifra titulo="Novedades" valor={String(resumen.novedades)} nota="entregas cerradas con novedad" />
          </div>

          {/* La base del porcentaje se declara SIEMPRE. Un cumplimiento sobre una
              base recortada en silencio se ve idéntico a uno bueno. */}
          {resumen.sinCompromiso > 0 && (
            <p className="text-[13px] text-muted-foreground">
              {resumen.sinCompromiso} de {resumen.total} entregas no tienen fecha comprometida
              registrada y quedan fuera del porcentaje de cumplimiento.
            </p>
          )}

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Análisis</h2>
                <p className="text-[13px] text-muted-foreground">
                  Redactado sobre las cifras de arriba. No las recalcula.
                </p>
              </div>
              <Button onClick={redactar} disabled={redactando}>
                <Sparkles className="size-4" />
                {redactando ? 'Redactando…' : analisis ? 'Volver a redactar' : 'Generar análisis'}
              </Button>
            </div>

            {errorAnalisis && (
              <p className="text-[13px] text-destructive">
                {errorAnalisis} — las cifras de arriba siguen siendo válidas.
              </p>
            )}

            {analisis && (
              <div className="space-y-4 text-sm">
                <p>{analisis.resumen}</p>
                <div>
                  <h3 className="mb-1 font-medium">Hallazgos</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {analisis.hallazgos.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Oportunidades de mejora</h3>
                  <ul className="space-y-2">
                    {analisis.oportunidades.map((o) => (
                      <li key={o.texto} className="flex flex-wrap items-start gap-2">
                        <StatusBadge tone={DEPENDE_UI[o.dependeDe].tone}>
                          {DEPENDE_UI[o.dependeDe].label}
                        </StatusBadge>
                        <span className="text-muted-foreground">{o.texto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          {problemas.length > 0 && (
            <Card className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Punto</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Comprometida</TableHead>
                    <TableHead>Reprogramada</TableHead>
                    <TableHead>Entregada</TableHead>
                    <TableHead>Entregó</TableHead>
                    <TableHead>Novedad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemas.map((e) => (
                    <TableRow key={e.factura ?? `${e.tienda}-${e.fechaProgramada}`}>
                      <TableCell className="font-mono text-[13px]">{e.factura ?? '—'}</TableCell>
                      <TableCell className="font-medium">{e.tienda}</TableCell>
                      <TableCell>{e.ciudad}</TableCell>
                      <TableCell className="font-mono text-[13px]">{e.fechaProgramada ?? '—'}</TableCell>
                      {/* Sólo referencia: el cumplimiento SIEMPRE se mide contra la
                          comprometida (confirmado por la dueña, 2026-09-02) — nunca contra
                          esta. Mostrarla ayuda a ver el patrón de reprogramaciones. */}
                      <TableCell className="font-mono text-[13px] text-muted-foreground">
                        {e.fechaReprogramada ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-[13px]">{e.fechaEntrega ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{e.conductor ?? '—'}</TableCell>
                      <TableCell>
                        {e.novedad ? (
                          <StatusBadge tone="danger">{NOVEDAD_UI[e.novedad] ?? e.novedad}</StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">Fuera de fecha</StatusBadge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Cifra({ titulo, valor, nota }: { titulo: string; valor: string; nota: string }) {
  return (
    <Card className="p-4">
      <p className="text-[13px] text-muted-foreground">{titulo}</p>
      <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">{valor}</p>
      <p className="mt-1 text-xs text-faint">{nota}</p>
    </Card>
  )
}
