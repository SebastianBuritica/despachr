'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  MapPin,
  Navigation,
  Phone,
  Check,
  LogOut,
  PackageOpen,
  Loader2,
  RotateCcw,
  Eraser,
  WifiOff,
  CloudOff,
  CloudUpload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useConexion } from '@/hooks/useConexion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { DriverSkeleton } from '@/components/driver/DriverSkeleton'
import { SignaturePad, type SignaturePadHandle } from '@/components/driver/SignaturePad'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getRutaDelDia,
  getEntregasDeRuta,
  marcarEntregada,
  type RutaDelDia,
  type EntregaConductor,
} from '@/lib/queries/driver'
import {
  registrarEvento,
  nuevaIdentidadEvento,
  type EventoIdentidad,
} from '@/lib/queries/events'
import { uploadCumplido, uploadFirma, StorageError } from '@/lib/storage'
import { capturarUbicacion, type Coords } from '@/lib/geo'
import { confirmarCumplido, nuevoProgreso, type CumplidoProgreso } from '@/lib/cumplido'
import { encolar } from '@/lib/offline/cola'
import { guardarSnapshot, leerSnapshot } from '@/lib/offline/snapshot'
import { normalizePhone, toTelHref } from '@/lib/phone'
import type { EstadoEntrega } from '@/types'

type Screen = 'list' | 'active' | 'capture' | 'done'

// Presentación de cada estado de entrega (label + tono del badge). Antes vivía
// en el mock; ahora es constante de UI del conductor.
const ESTADO_UI: Record<EstadoEntrega, { label: string; tone: StatusTone }> = {
  entregado: { label: 'Entregada', tone: 'success' },
  en_punto: { label: 'En punto', tone: 'warning' },
  pendiente: { label: 'Pendiente', tone: 'neutral' },
  novedad: { label: 'Novedad', tone: 'danger' },
  no_entregado: { label: 'No entregada', tone: 'danger' },
}

function mmss(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Segundos transcurridos desde una marca de tiempo ISO (hora_llegada_punto).
// El timer se siembra desde la BD, así un refresh no lo reinicia.
function elapsedSeconds(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000))
}

function formatFecha(fecha: string): string {
  // Se ancla al mediodía para que el formateo por zona no corra el día.
  const d = new Date(`${fecha}T12:00:00`)
  const s = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '—'
}

export function DriverApp() {
  const { profile, user } = useAuth()
  const { online, pendientes, refrescarPendientes } = useConexion()
  const [route, setRoute] = useState<RutaDelDia | null>(null)
  const [deliveries, setDeliveries] = useState<EntregaConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  // Marca de tiempo del snapshot cuando la ruta se muestra sin conexión.
  const [desdeSnapshot, setDesdeSnapshot] = useState<number | null>(null)

  const [screen, setScreen] = useState<Screen>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [, setTick] = useState(0)
  const [completedAt, setCompletedAt] = useState('')
  const [doneSeconds, setDoneSeconds] = useState(0)
  const [donePendiente, setDonePendiente] = useState(false)

  // Estado de la conexión Realtime (indicador sutil de "sync en vivo caído").
  const [syncDown, setSyncDown] = useState(false)
  const [reconnectNonce, setReconnectNonce] = useState(0)

  const active = deliveries.find((d) => d.id === activeId) ?? null

  const refetch = useCallback(async (routeId: string) => {
    const ds = await getEntregasDeRuta(routeId)
    setDeliveries(ds)
    return ds
  }, [])

  // Carga (ruta del día + sus entregas). `silent` = recarga en background por
  // Realtime: no escala el error a la frontera (un fallo transitorio de una
  // suscripción no debe tumbar la app; la carga inicial sí). `loading` arranca
  // en true y solo la carga inicial lo apaga, así no hay setState síncrono en el
  // efecto ni parpadeo del esqueleto en las recargas.
  const load = useCallback(async (silent = false) => {
    try {
      const r = await getRutaDelDia()
      const ds = r ? await getEntregasDeRuta(r.id) : []
      setRoute(r)
      setDeliveries(ds)
      setDesdeSnapshot(null)
      // Se guarda lo último bueno para poder arrancar sin señal (ver snapshot.ts).
      void guardarSnapshot(r, ds, Date.parse(new Date().toISOString()))
    } catch (e) {
      // Sin red: en vez de la pantalla de error, la última ruta conocida —
      // marcada como tal. Un conductor sin sus paradas no puede trabajar; uno
      // con las paradas de ayer creyéndolas de hoy es peor. Por eso se muestra
      // CON la hora del dato y sólo cuando la carga falló de verdad.
      const snap = await leerSnapshot()
      if (snap) {
        setRoute(snap.route)
        setDeliveries(snap.deliveries)
        setDesdeSnapshot(snap.guardadoEn)
        console.warn('Mostrando ruta desde snapshot offline:', e)
      } else if (!silent) {
        setError(e instanceof Error ? e : new Error('Error al cargar la ruta'))
      } else {
        console.warn('Recarga por Realtime falló:', e)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Carga inicial. Los errores se re-lanzan en render → app/driver/error.tsx.
  // La IIFE async evita el falso positivo de set-state-in-effect: los setState
  // de load() ocurren tras un await, no de forma síncrona en el cuerpo del efecto.
  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [load])

  // Realtime: el coordinador puede asignar/cambiar la ruta o una entrega a mitad
  // de jornada; el conductor debe verlo sin recargar a mano (si no, el coordinador
  // termina avisando por WhatsApp — justo el hábito que este producto elimina).
  // Suscripción acotada a ESTE conductor: cambios en sus routes (incluye una ruta
  // recién asignada, aunque hoy no tenga ninguna) y en las deliveries de su ruta.
  // Una re-lectura por cambio basta; sin parcheo granular de filas. La RLS aplica
  // a Realtime, así que solo llegan sus filas. En CHANNEL_ERROR/TIMED_OUT se marca
  // el sync como caído (indicador sutil) y se reintenta reconectar (bump del nonce).
  const uid = user?.id
  const routeId = route?.id
  useEffect(() => {
    if (!uid) return
    const channel = supabase.channel(`driver-${uid}`)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'routes', filter: `driver_id=eq.${uid}` },
      () => load(true)
    )
    if (routeId) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries', filter: `route_id=eq.${routeId}` },
        () => load(true)
      )
    }
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSyncDown(false)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setSyncDown(true)
        // Reintento con respiro (no martillar): re-monta el canal vía el nonce.
        reconnectTimer = setTimeout(() => setReconnectNonce((n) => n + 1), 3000)
      }
    })
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      supabase.removeChannel(channel)
    }
  }, [uid, routeId, load, reconnectNonce])

  // Timer visual: corre solo mientras la entrega activa está "en punto".
  useEffect(() => {
    if (screen !== 'active' || active?.estado !== 'en_punto') return
    const t = setInterval(() => setTick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [screen, active?.estado])

  // Errores de carga → frontera de error (no construimos UI de error nueva).
  if (error) throw error
  if (loading) return <DriverSkeleton />

  const doneCount = deliveries.filter((d) => d.estado === 'entregado').length

  const open = (d: EntregaConductor) => {
    setActiveId(d.id)
    setScreen('active')
  }

  // "Llegué al punto" → evento llegada_punto (+GPS). El trigger de la BD pone
  // hora_llegada_punto y estado 'en_punto'; re-leemos en vez de recalcular.
  //
  // OFFLINE: la identidad (id + hora) se genera AQUÍ, cuando el conductor
  // llega. Si el envío no pasa, el mismo evento se encola con esa identidad —
  // así la hora registrada es la de la llegada real, no la del sync, y
  // reenviarlo no lo duplica (choque de PK = ya estaba).
  const handleLlegue = async () => {
    if (!active) return
    setBusy(true)
    const identidad = nuevaIdentidadEvento()
    try {
      const coords = await capturarUbicacion()
      try {
        await registrarEvento('llegada_punto', active.id, active.routeId, coords, identidad)
        await refetch(active.routeId)
        if (!coords) toast('Evento registrado sin ubicación')
      } catch (envio) {
        await encolar({
          id: identidad.id,
          tipo: 'evento',
          // Deriva de la hora ya capturada: una sola fuente de tiempo, y así
          // el orden de la cola coincide con el orden real de los hechos.
          creadoEn: Date.parse(identidad.timestamp),
          tipoEvento: 'llegada_punto',
          deliveryId: active.id,
          routeId: active.routeId,
          coords,
          timestamp: identidad.timestamp,
        })
        // Sin red no se puede re-leer, así que la fila se refleja localmente
        // con lo que el trigger habría derivado. El próximo refetch corrige.
        setDeliveries((ds) =>
          ds.map((d) =>
            d.id === active.id
              ? { ...d, estado: 'en_punto' as EstadoEntrega, horaLlegada: identidad.timestamp }
              : d
          )
        )
        await refrescarPendientes()
        toast('Guardado sin señal', {
          description: 'Se enviará solo cuando vuelva la conexión.',
        })
        console.warn('Llegada encolada:', envio)
      }
    } catch {
      toast.error('No se pudo registrar la llegada. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  // Tras confirmar el cumplido (CaptureScreen ya subió evidencia + cerró la
  // entrega): re-lee para que la lista/DoneScreen reflejen la evidencia real, y
  // pasa a la pantalla de confirmación.
  const handleConfirmed = async (result: {
    seconds: number
    completedAt: string
    pendienteDeEnvio?: boolean
  }) => {
    setDoneSeconds(result.seconds)
    setCompletedAt(result.completedAt)
    setDonePendiente(!!result.pendienteDeEnvio)
    if (result.pendienteDeEnvio) {
      // Sin red no hay nada que re-leer: se refleja localmente lo entregado.
      setDeliveries((ds) =>
        ds.map((d) => (d.id === activeId ? { ...d, estado: 'entregado' as EstadoEntrega } : d))
      )
      await refrescarPendientes()
    } else if (route) {
      await refetch(route.id)
    }
    setScreen('done')
  }

  if (screen === 'active' && active) {
    return (
      <ActiveScreen
        delivery={active}
        index={deliveries.findIndex((d) => d.id === activeId)}
        total={deliveries.length}
        seconds={elapsedSeconds(active.horaLlegada)}
        busy={busy}
        onBack={() => setScreen('list')}
        onLlegue={handleLlegue}
        onCapture={() => setScreen('capture')}
      />
    )
  }

  if (screen === 'capture' && active) {
    return (
      <CaptureScreen
        delivery={active}
        onBack={() => setScreen('active')}
        onConfirmed={handleConfirmed}
      />
    )
  }

  if (screen === 'done' && active) {
    return (
      <DoneScreen
        delivery={active}
        seconds={doneSeconds}
        completedAt={completedAt}
        pendienteDeEnvio={donePendiente}
        onBack={() => setScreen('list')}
      />
    )
  }

  return (
    <ListScreen
      route={route}
      driverName={profile?.name ?? 'Conductor'}
      deliveries={deliveries}
      doneCount={doneCount}
      syncDown={syncDown}
      online={online}
      pendientes={pendientes}
      desdeSnapshot={desdeSnapshot}
      onOpen={open}
    />
  )
}

/* ----------------------------- Lista ----------------------------- */

function ListScreen({
  route,
  driverName,
  deliveries,
  doneCount,
  syncDown,
  online,
  pendientes,
  desdeSnapshot,
  onOpen,
}: {
  route: RutaDelDia | null
  driverName: string
  deliveries: EntregaConductor[]
  doneCount: number
  syncDown: boolean
  online: boolean
  pendientes: number
  desdeSnapshot: number | null
  onOpen: (d: EntregaConductor) => void
}) {
  const router = useRouter()
  const { signOut } = useAuth()
  const total = deliveries.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/login')
      router.refresh()
    } catch {
      toast.error('No se pudo cerrar sesión. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="rounded-b-[22px] bg-panel px-5 pb-5 pt-6 text-panel-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-panel-muted">Ruta de hoy</p>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight">
              {route ? formatFecha(route.fecha) : 'Sin ruta hoy'}
            </h1>
            <p className="mt-1 text-xs text-panel-muted">
              {driverName}
              {route?.placa ? ` · ${route.placa}` : ''}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Cuenta">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-brand text-sm font-semibold text-white">
                    {initials(driverName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-sm tabular-nums">
            {doneCount}/{total}
          </span>
        </div>

        {!online || desdeSnapshot ? (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-panel-muted">
            <CloudOff className="size-3" />
            {desdeSnapshot
              ? `Sin conexión · datos de las ${new Date(desdeSnapshot).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
              : 'Sin señal · lo que registres se guarda y se envía solo'}
            {pendientes > 0 && ` · ${pendientes} por enviar`}
          </p>
        ) : pendientes > 0 ? (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-panel-muted">
            <CloudUpload className="size-3 animate-pulse" />
            Enviando {pendientes} {pendientes === 1 ? 'registro' : 'registros'} pendientes…
          </p>
        ) : (
          syncDown && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-panel-muted">
              <WifiOff className="size-3" />
              Sin conexión en vivo · reintentando…
            </p>
          )
        )}
      </header>

      <div className="flex-1 space-y-3 p-4">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Entregas del día
        </p>
        {deliveries.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Sin entregas para hoy"
            message="No tienes entregas asignadas. Cuando coordinación arme tu ruta, aparecerá aquí."
            className="mt-2"
          />
        ) : (
          deliveries.map((d) => (
            <DeliveryListCard key={d.id} delivery={d} onOpen={() => onOpen(d)} />
          ))
        )}
      </div>
    </div>
  )
}

function DeliveryListCard({
  delivery,
  onOpen,
}: {
  delivery: EntregaConductor
  onOpen: () => void
}) {
  const s = ESTADO_UI[delivery.estado]
  const cta =
    delivery.estado === 'entregado'
      ? 'Ver detalle'
      : delivery.estado === 'en_punto'
        ? 'Continuar'
        : 'Iniciar'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'block w-full animate-fade-up rounded-xl border bg-card p-4 text-left shadow-card transition-colors',
        delivery.estado === 'en_punto'
          ? 'border-brand ring-2 ring-brand/20'
          : 'border-border hover:bg-muted/40'
      )}
    >
      <div className="flex items-center justify-between">
        <StatusBadge tone={s.tone} dot>
          {s.label}
        </StatusBadge>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          Punto {delivery.secuencia}
        </span>
      </div>
      <p className="mt-3 text-[15px] font-semibold">{delivery.cliente}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{delivery.direccion}</p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">{delivery.ciudad}</span>
        <span className="flex items-center gap-1 text-sm font-medium text-brand">
          {cta}
          <ChevronRight className="size-4" />
        </span>
      </div>
    </button>
  )
}

/* -------------------------- Entrega activa -------------------------- */

function ActiveScreen({
  delivery,
  index,
  total,
  seconds,
  busy,
  onBack,
  onLlegue,
  onCapture,
}: {
  delivery: EntregaConductor
  index: number
  total: number
  seconds: number
  busy: boolean
  onBack: () => void
  onLlegue: () => void
  onCapture: () => void
}) {
  const s = ESTADO_UI[delivery.estado]
  const pendiente = delivery.estado === 'pendiente'
  const enPunto = delivery.estado === 'en_punto'

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Volver"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              Entrega {index + 1} de {total}
            </p>
            <p className="font-semibold leading-tight">{delivery.cliente}</p>
          </div>
          <StatusBadge tone={s.tone} dot>
            {s.label}
          </StatusBadge>
        </div>

        {/* Timer — solo cuando ya se marcó la llegada */}
        {enPunto && (
          <div className="animate-fade-up rounded-2xl bg-panel p-6 text-center text-panel-foreground">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
              Tiempo en sitio
            </p>
            <p className="mt-2 font-mono text-5xl font-semibold tabular-nums">{mmss(seconds)}</p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-panel-muted">
              <span className="size-2 animate-ping rounded-full bg-brand-light" />
              En curso
            </p>
          </div>
        )}

        {/* Dirección */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-brand dark:bg-green-500/15 dark:text-brand-light">
              <MapPin className="size-4" />
            </span>
            <div>
              <p className="font-medium">{delivery.direccion}</p>
              <p className="text-sm text-muted-foreground">{delivery.ciudad}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" asChild>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${delivery.direccion}, ${delivery.ciudad}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" />
                Navegar
              </a>
            </Button>
            {delivery.telefono ? (
              <Button variant="outline" asChild>
                {/* telefono_receptor lo escribe el coordinador a mano, así que
                    llega como sea ("320 123 4567", con guiones, sin indicativo).
                    Se normaliza al marcar: un tel: sin indicativo es ambiguo
                    para el marcador y el conductor llama desde la calle. */}
                <a href={toTelHref(normalizePhone(delivery.telefono))}>
                  <Phone className="size-4" />
                  Llamar
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Phone className="size-4" />
                Llamar
              </Button>
            )}
          </div>
        </div>

        {/* Detalle del punto */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">Detalle del punto</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Punto" value={`#${delivery.secuencia}`} mono />
            <Row label="Ciudad" value={delivery.ciudad} />
            <Row label="Estado" value={s.label} />
          </dl>
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-card p-4">
        {pendiente ? (
          <Button className="h-12 w-full" onClick={onLlegue} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            {busy ? 'Registrando…' : 'Llegué al punto'}
          </Button>
        ) : enPunto ? (
          <Button className="h-12 w-full" onClick={onCapture} disabled={busy}>
            <Camera className="size-4" />
            Capturar cumplido
          </Button>
        ) : (
          <Button className="h-12 w-full" variant="outline" onClick={onBack}>
            Volver a la ruta
          </Button>
        )}
      </footer>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium', mono && 'font-mono tabular-nums')}>{value}</dd>
    </div>
  )
}

/* ------------------------ Captura de cumplido ------------------------ */

function CaptureScreen({
  delivery,
  onBack,
  onConfirmed,
}: {
  delivery: EntregaConductor
  onBack: () => void
  onConfirmed: (r: {
    seconds: number
    completedAt: string
    pendienteDeEnvio?: boolean
  }) => void | Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureRef = useRef<SignaturePadHandle>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [receiver, setReceiver] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<string | null>(null)

  // Lo ya logrado en intentos anteriores: un reintento tras un fallo NO re-sube
  // lo que ya funcionó (y evita el choque con upsert:false del helper). Vive en
  // un ref porque debe sobrevivir al re-render que provoca el error, no
  // dispararlo. La orquestación y sus pruebas están en lib/cumplido.ts.
  const progresoRef = useRef<CumplidoProgreso>(nuevoProgreso())
  // Identidad del evento de salida y coords: se fijan en el PRIMER intento y
  // se reusan al encolar, para que la hora y el lugar sean los de la entrega.
  // Se crean dentro del handler, no en render: generar un UUID al renderizar es
  // impuro y además desperdicia uno por cada re-render.
  const salidaRef = useRef<EventoIdentidad | null>(null)
  const coordsRef = useRef<Coords | null>(null)

  // Libera el object URL del preview al reemplazar/desmontar (evita fuga).
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    // Se limpia SIEMPRE y desde el input, no desde el evento: si el conductor
    // cancela y vuelve a elegir la MISMA foto, el navegador sólo dispara
    // `change` cuando el valor cambió. Sin este reset, reintentar la misma
    // captura no hace nada — y es justo lo que hace quien cree que falló.
    input.value = ''
    if (!file) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    progresoRef.current.fotoPath = null // foto nueva → invalida una subida previa
  }

  const retomarFoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
    progresoRef.current.fotoPath = null
    fileInputRef.current?.click()
  }

  const limpiarFirma = () => {
    signatureRef.current?.clear()
    setHasSignature(false)
    progresoRef.current.firmaPath = null
  }

  // Foto requerida (evidencia legal) + nombre de quien recibe. Firma OPCIONAL.
  const ready = !!photoFile && receiver.trim().length > 0

  const confirm = async () => {
    if (!photoFile) return
    salidaRef.current ??= nuevaIdentidadEvento()
    const salida = salidaRef.current
    setBusy(true)
    try {
      const { coords } = await confirmarCumplido(
        {
          routeId: delivery.routeId,
          deliveryId: delivery.id,
          foto: photoFile,
          recibidoPor: receiver,
          hayFirma: hasSignature,
          obtenerFirma: () => Promise.resolve(signatureRef.current?.toBlob()),
        },
        progresoRef.current,
        {
          subirFoto: uploadCumplido,
          subirFirma: uploadFirma,
          registrarSalida: (deliveryId, routeId, c) =>
            registrarEvento('salida_punto', deliveryId, routeId, c, salida),
          marcarEntregada,
          capturarUbicacion: async () => {
            coordsRef.current ??= await capturarUbicacion()
            return coordsRef.current
          },
        },
        {
          onEtapa: setStage,
          onFirmaPerdida: () =>
            toast.warning('No pudimos guardar la firma', {
              description:
                'La entrega se registra con la foto. Puedes pedir la firma en el papel.',
            }),
        }
      )

      if (!coords) toast('Evento registrado sin ubicación')
      await onConfirmed({
        seconds: elapsedSeconds(delivery.horaLlegada),
        completedAt: new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    } catch (e) {
      // OFFLINE: el cumplido se encola COMPLETO — foto y firma como Blobs en
      // IndexedDB, más las coords y la identidad del evento de salida. Es la
      // diferencia entre "reintenta cuando vuelvas a tener señal" (que obliga
      // al conductor a quedarse en el punto) y "sigue tu ruta, esto se envía
      // solo". Un File en estado de React no sobrevive ni a recargar.
      try {
        const firma = hasSignature ? ((await signatureRef.current?.toBlob()) ?? null) : null
        await encolar({
          id: salida.id,
          tipo: 'cumplido',
          creadoEn: Date.parse(salida.timestamp),
          deliveryId: delivery.id,
          routeId: delivery.routeId,
          foto: photoFile,
          firma,
          recibidoPor: receiver.trim(),
          coords: coordsRef.current,
          salida,
          progreso: progresoRef.current,
        })
        await onConfirmed({
          seconds: elapsedSeconds(delivery.horaLlegada),
          completedAt: new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          pendienteDeEnvio: true,
        })
        return
      } catch (encolarError) {
        // Ni siquiera se pudo encolar (sin IndexedDB, cuota llena). Aquí sí hay
        // que retener al conductor: la captura sigue en pantalla y es lo único
        // que queda de la evidencia.
        console.error('No se pudo encolar el cumplido:', encolarError)
        const msg =
          e instanceof StorageError
            ? e.message
            : 'No se pudo guardar el cumplido. Revisa tu conexión y reintenta — no perdiste la captura.'
        toast.error(msg)
      }
    } finally {
      setBusy(false)
      setStage(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-5 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card disabled:opacity-50"
            aria-label="Volver"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Cumplido de entrega</p>
            <p className="font-semibold leading-tight">{delivery.cliente}</p>
          </div>
        </div>

        {/* Foto — cámara trasera en móvil, selector en desktop */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Evidencia fotográfica</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPickPhoto}
          />
          {photoPreview ? (
            <div className="space-y-2">
              <div
                className="relative h-44 w-full overflow-hidden rounded-xl border-2 border-brand bg-muted"
                style={{
                  backgroundImage: `url(${photoPreview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-brand text-white">
                  <Check className="size-3.5" />
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={retomarFoto}
                disabled={busy}
              >
                <RotateCcw className="size-4" />
                Volver a tomar
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-brand"
            >
              <Camera className="size-6" />
              <span className="text-sm">Tomar foto de la carga entregada</span>
            </button>
          )}
        </div>

        {/* Firma — opcional (hay receptores que no firman) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Firma de quien recibe{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </p>
            {hasSignature && (
              <button
                type="button"
                onClick={limpiarFirma}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Eraser className="size-3.5" />
                Limpiar
              </button>
            )}
          </div>
          <SignaturePad ref={signatureRef} onChange={setHasSignature} />
        </div>

        {/* Recibido por */}
        <div className="space-y-2">
          <Label htmlFor="receiver">Recibido por</Label>
          <Input
            id="receiver"
            placeholder="Nombre de quien recibe"
            // `recibido_por` es text sin límite en la BD, pero esto se teclea
            // en un celular a la carrera: 80 caracteres sobran para un nombre y
            // evitan que un teclado trabado mande medio párrafo al cumplido.
            maxLength={80}
            autoComplete="name"
            autoCapitalize="words"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-card p-4">
        <Button className="h-12 w-full" disabled={!ready || busy} onClick={confirm}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy
            ? (stage ?? 'Guardando…')
            : ready
              ? 'Confirmar entrega'
              : 'Completa foto y quién recibe'}
        </Button>
      </footer>
    </div>
  )
}

/* --------------------------- Confirmación --------------------------- */

function DoneScreen({
  delivery,
  seconds,
  completedAt,
  pendienteDeEnvio,
  onBack,
}: {
  delivery: EntregaConductor
  seconds: number
  completedAt: string
  pendienteDeEnvio: boolean
  onBack: () => void
}) {
  // Evidencia HONESTA: refleja lo realmente persistido, no un check fijo.
  // Encolado: la evidencia está en el dispositivo, no en el servidor todavía,
  // así que delivery.fotoUrl aún es null. Afirmar "Foto ✓" sería mentir en la
  // dirección peligrosa; afirmar "Sin evidencia" mentiría en la otra.
  const partes: string[] = []
  if (delivery.fotoUrl) partes.push('Foto')
  if (delivery.firmaUrl) partes.push('firma')
  const evidencia = pendienteDeEnvio
    ? 'Guardada en el equipo'
    : partes.length
      ? `${partes.join(' + ')} ✓`
      : 'Sin evidencia'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <span className="flex size-20 animate-pop items-center justify-center rounded-full bg-[#DCFCE7] text-brand dark:bg-green-500/15 dark:text-brand-light">
        <Check className="size-10" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Entrega confirmada</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {pendienteDeEnvio ? (
          <>
            El cumplido de{' '}
            <span className="font-semibold text-foreground">{delivery.cliente}</span> quedó guardado
            en tu equipo. Se envía a coordinación apenas vuelva la señal — puedes seguir tu ruta.
          </>
        ) : (
          <>
            El cumplido de{' '}
            <span className="font-semibold text-foreground">{delivery.cliente}</span> fue registrado
            y enviado a coordinación.
          </>
        )}
      </p>

      <div className="mt-8 w-full max-w-xs space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm shadow-card">
        <Row label="Tiempo en sitio" value={mmss(seconds)} mono />
        <Row label="Cliente" value={delivery.cliente} />
        <Row label="Ciudad" value={delivery.ciudad} />
        {delivery.recibidoPor && <Row label="Recibió" value={delivery.recibidoPor} />}
        <Row label="Evidencia" value={evidencia} />
        <Row label="Hora" value={completedAt} mono />
      </div>

      <Button className="mt-8 h-12 w-full max-w-xs" onClick={onBack}>
        Volver a la ruta
      </Button>
    </div>
  )
}
