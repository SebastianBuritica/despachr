'use client'

import { useCallback, useEffect, useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { DriverSkeleton } from '@/components/driver/DriverSkeleton'
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
import { registrarEvento } from '@/lib/queries/events'
import { capturarUbicacion } from '@/lib/geo'
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
  const [route, setRoute] = useState<RutaDelDia | null>(null)
  const [deliveries, setDeliveries] = useState<EntregaConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [screen, setScreen] = useState<Screen>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [, setTick] = useState(0)
  const [photo, setPhoto] = useState(false)
  const [signed, setSigned] = useState(false)
  const [receiver, setReceiver] = useState('')
  const [completedAt, setCompletedAt] = useState('')
  const [doneSeconds, setDoneSeconds] = useState(0)

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
      setRoute(r)
      setDeliveries(r ? await getEntregasDeRuta(r.id) : [])
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e : new Error('Error al cargar la ruta'))
      else console.warn('Recarga por Realtime falló:', e)
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
  // Una re-lectura por cambio basta; sin parcheo granular de filas. Limpia el
  // canal al desmontar. La RLS aplica a Realtime, así que solo llegan sus filas.
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
    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid, routeId, load])

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
    setPhoto(false)
    setSigned(false)
    setReceiver('')
    setScreen('active')
  }

  // "Llegué al punto" → evento llegada_punto (+GPS). El trigger de la BD pone
  // hora_llegada_punto y estado 'en_punto'; re-leemos en vez de recalcular.
  const handleLlegue = async () => {
    if (!active) return
    setBusy(true)
    try {
      const coords = await capturarUbicacion()
      await registrarEvento('llegada_punto', active.id, active.routeId, coords)
      await refetch(active.routeId)
      if (!coords) toast('Evento registrado sin ubicación')
    } catch {
      toast.error('No se pudo registrar la llegada. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  // "Confirmar entrega" → salida_punto (+GPS) + cierre de la entrega. El trigger
  // calcula tiempo_en_punto_minutos; la app marca estado 'entregado'.
  const handleConfirm = async () => {
    if (!active) return
    setBusy(true)
    try {
      const coords = await capturarUbicacion()
      await registrarEvento('salida_punto', active.id, active.routeId, coords)
      await marcarEntregada(active.id)
      setDoneSeconds(elapsedSeconds(active.horaLlegada))
      setCompletedAt(
        new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      )
      await refetch(active.routeId)
      if (!coords) toast('Evento registrado sin ubicación')
      setScreen('done')
    } catch {
      toast.error('No se pudo confirmar la entrega. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
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
        photo={photo}
        signed={signed}
        receiver={receiver}
        busy={busy}
        onPhoto={() => setPhoto(true)}
        onSign={() => setSigned(true)}
        onReceiver={setReceiver}
        onBack={() => setScreen('active')}
        onConfirm={handleConfirm}
      />
    )
  }

  if (screen === 'done' && active) {
    return (
      <DoneScreen
        delivery={active}
        seconds={doneSeconds}
        completedAt={completedAt}
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
  onOpen,
}: {
  route: RutaDelDia | null
  driverName: string
  deliveries: EntregaConductor[]
  doneCount: number
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
                <a href={`tel:${delivery.telefono}`}>
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
  photo,
  signed,
  receiver,
  busy,
  onPhoto,
  onSign,
  onReceiver,
  onBack,
  onConfirm,
}: {
  delivery: EntregaConductor
  photo: boolean
  signed: boolean
  receiver: string
  busy: boolean
  onPhoto: () => void
  onSign: () => void
  onReceiver: (v: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const ready = photo && signed && receiver.trim().length > 0
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-5 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Volver"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Cumplido de entrega</p>
            <p className="font-semibold leading-tight">{delivery.cliente}</p>
          </div>
        </div>

        {/* Foto (simulada — Fase 1.2) */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Evidencia fotográfica</p>
          <button
            type="button"
            onClick={onPhoto}
            className={cn(
              'flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors',
              photo ? 'border-brand' : 'border-border text-muted-foreground'
            )}
          >
            {photo ? (
              <div
                className="relative flex h-full w-full items-center justify-center rounded-[10px]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #eef2f6 0 10px, #f8fafc 10px 20px)',
                }}
              >
                <span className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
                  FOTO_CARGA_01.jpg
                </span>
                <span className="absolute right-3 top-3 flex size-6 animate-pop items-center justify-center rounded-full bg-brand text-white">
                  <Check className="size-3.5" />
                </span>
              </div>
            ) : (
              <>
                <Camera className="size-6" />
                <span className="text-sm">Tomar foto de la carga entregada</span>
              </>
            )}
          </button>
        </div>

        {/* Firma (simulada — Fase 1.2) */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Firma de quien recibe</p>
          <button
            type="button"
            onClick={onSign}
            className={cn(
              'flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed transition-colors',
              signed ? 'border-brand' : 'border-border text-muted-foreground'
            )}
          >
            {signed ? (
              <span
                className="animate-pop text-3xl text-foreground"
                style={{ fontFamily: 'Snell Roundhand, Brush Script MT, cursive' }}
              >
                Andrés R.
              </span>
            ) : (
              <span className="text-sm">Toca para firmar</span>
            )}
          </button>
        </div>

        {/* Recibido por */}
        <div className="space-y-2">
          <Label htmlFor="receiver">Recibido por</Label>
          <Input
            id="receiver"
            placeholder="Nombre de quien recibe"
            value={receiver}
            onChange={(e) => onReceiver(e.target.value)}
          />
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-card p-4">
        <Button className="h-12 w-full" disabled={!ready || busy} onClick={onConfirm}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy
            ? 'Confirmando…'
            : ready
              ? 'Confirmar entrega'
              : 'Completa foto, firma y quién recibe'}
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
  onBack,
}: {
  delivery: EntregaConductor
  seconds: number
  completedAt: string
  onBack: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <span className="flex size-20 animate-pop items-center justify-center rounded-full bg-[#DCFCE7] text-brand dark:bg-green-500/15 dark:text-brand-light">
        <Check className="size-10" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Entrega confirmada</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        El cumplido de <span className="font-semibold text-foreground">{delivery.cliente}</span> fue
        registrado y enviado a coordinación.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm shadow-card">
        <Row label="Tiempo en sitio" value={mmss(seconds)} mono />
        <Row label="Cliente" value={delivery.cliente} />
        <Row label="Ciudad" value={delivery.ciudad} />
        <Row label="Evidencia" value="Foto + firma ✓" />
        <Row label="Hora" value={completedAt} mono />
      </div>

      <Button className="mt-8 h-12 w-full max-w-xs" onClick={onBack}>
        Volver a la ruta
      </Button>
    </div>
  )
}
