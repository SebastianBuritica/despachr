'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  MapPin,
  Navigation,
  Phone,
  Check,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DRIVER_ROUTE,
  DRIVER_DELIVERIES,
  DELIVERY_STATUS,
  type DriverDelivery,
} from '@/lib/mock/driver'

type Screen = 'list' | 'active' | 'capture' | 'done'

function mmss(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function DriverApp() {
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>(DRIVER_DELIVERIES)
  const [screen, setScreen] = useState<Screen>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [photo, setPhoto] = useState(false)
  const [signed, setSigned] = useState(false)
  const [receiver, setReceiver] = useState('')

  // DECISIÓN: el timer solo corre mientras la pantalla activa es la entrega.
  useEffect(() => {
    if (screen !== 'active') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [screen])

  const active = deliveries.find((d) => d.id === activeId) ?? null
  const activeIndex = deliveries.findIndex((d) => d.id === activeId)
  const doneCount = deliveries.filter((d) => d.status === 'delivered').length

  const open = (d: DriverDelivery) => {
    setActiveId(d.id)
    // Las entregas "en punto" arrancan con tiempo acumulado (~6:12).
    setSeconds(d.status === 'onsite' ? 372 : 0)
    setPhoto(false)
    setSigned(false)
    setReceiver('')
    setScreen('active')
  }

  const confirm = () => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, status: 'delivered' } : d))
    )
    setScreen('done')
  }

  if (screen === 'active' && active) {
    return (
      <ActiveScreen
        delivery={active}
        index={activeIndex}
        total={deliveries.length}
        seconds={seconds}
        onBack={() => setScreen('list')}
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
        onPhoto={() => setPhoto(true)}
        onSign={() => setSigned(true)}
        onReceiver={setReceiver}
        onBack={() => setScreen('active')}
        onConfirm={confirm}
      />
    )
  }

  if (screen === 'done' && active) {
    return <DoneScreen delivery={active} seconds={seconds} onBack={() => setScreen('list')} />
  }

  return <ListScreen deliveries={deliveries} doneCount={doneCount} onOpen={open} />
}

/* ----------------------------- Lista ----------------------------- */

function ListScreen({
  deliveries,
  doneCount,
  onOpen,
}: {
  deliveries: DriverDelivery[]
  doneCount: number
  onOpen: (d: DriverDelivery) => void
}) {
  const router = useRouter()
  const { signOut } = useAuth()
  const total = deliveries.length
  const pct = Math.round((doneCount / total) * 100)

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="rounded-b-[22px] bg-sidebar px-5 pb-5 pt-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400">Ruta de hoy</p>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight">{DRIVER_ROUTE.name}</h1>
            <p className="mt-1 text-xs text-slate-400">
              {DRIVER_ROUTE.date} · {DRIVER_ROUTE.driver} · {DRIVER_ROUTE.plate}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Cuenta">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-brand text-sm font-semibold text-white">
                    {DRIVER_ROUTE.initials}
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
        {deliveries.map((d) => (
          <DeliveryListCard key={d.id} delivery={d} onOpen={() => onOpen(d)} />
        ))}
      </div>
    </div>
  )
}

function DeliveryListCard({ delivery, onOpen }: { delivery: DriverDelivery; onOpen: () => void }) {
  const s = DELIVERY_STATUS[delivery.status]
  const cta =
    delivery.status === 'delivered'
      ? 'Ver detalle'
      : delivery.status === 'onsite'
        ? 'Continuar'
        : 'Iniciar'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'block w-full animate-fade-up rounded-xl border bg-card p-4 text-left shadow-card transition-colors',
        delivery.status === 'onsite'
          ? 'border-brand ring-2 ring-brand/20'
          : 'border-border hover:bg-muted/40'
      )}
    >
      <div className="flex items-center justify-between">
        <StatusBadge tone={s.tone} dot>
          {s.label}
        </StatusBadge>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {delivery.window}
        </span>
      </div>
      <p className="mt-3 text-[15px] font-semibold">{delivery.client}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{delivery.address}</p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{delivery.tons}</span> ·{' '}
          {delivery.units}
        </span>
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
  onBack,
  onCapture,
}: {
  delivery: DriverDelivery
  index: number
  total: number
  seconds: number
  onBack: () => void
  onCapture: () => void
}) {
  const s = DELIVERY_STATUS[delivery.status]
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
            <p className="font-semibold leading-tight">{delivery.client}</p>
          </div>
          <StatusBadge tone={s.tone} dot>
            {s.label}
          </StatusBadge>
        </div>

        {/* Timer */}
        <div className="animate-fade-up rounded-2xl bg-sidebar p-6 text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Tiempo en sitio
          </p>
          <p className="mt-2 font-mono text-5xl font-semibold tabular-nums">{mmss(seconds)}</p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-300">
            <span className="size-2 animate-ping rounded-full bg-brand-light" />
            En curso
          </p>
        </div>

        {/* Dirección */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-brand">
              <MapPin className="size-4" />
            </span>
            <div>
              <p className="font-medium">{delivery.address}</p>
              <p className="text-sm text-muted-foreground">{delivery.city}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline">
              <Navigation className="size-4" />
              Navegar
            </Button>
            <Button variant="outline">
              <Phone className="size-4" />
              Llamar
            </Button>
          </div>
        </div>

        {/* Carga */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">Carga a entregar</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Peso total" value={delivery.tons} mono />
            <Row label="Unidades" value={delivery.units} />
            <Row label="Ventana" value={delivery.window} mono />
          </dl>
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-card p-4">
        <Button className="h-12 w-full" onClick={onCapture}>
          <Camera className="size-4" />
          Capturar cumplido
        </Button>
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
  onPhoto,
  onSign,
  onReceiver,
  onBack,
  onConfirm,
}: {
  delivery: DriverDelivery
  photo: boolean
  signed: boolean
  receiver: string
  onPhoto: () => void
  onSign: () => void
  onReceiver: (v: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const ready = photo && signed
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
            <p className="font-semibold leading-tight">{delivery.client}</p>
          </div>
        </div>

        {/* Foto */}
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

        {/* Firma */}
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
        <Button className="h-12 w-full" disabled={!ready} onClick={onConfirm}>
          {ready ? 'Confirmar entrega' : 'Captura foto y firma para continuar'}
        </Button>
      </footer>
    </div>
  )
}

/* --------------------------- Confirmación --------------------------- */

function DoneScreen({
  delivery,
  seconds,
  onBack,
}: {
  delivery: DriverDelivery
  seconds: number
  onBack: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <span className="flex size-20 animate-pop items-center justify-center rounded-full bg-[#DCFCE7] text-brand">
        <Check className="size-10" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Entrega confirmada</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        El cumplido de <span className="font-semibold text-foreground">{delivery.client}</span> fue
        registrado y enviado a coordinación.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm shadow-card">
        <Row label="Tiempo en sitio" value={mmss(seconds)} mono />
        <Row label="Carga entregada" value={`${delivery.tons} · ${delivery.units}`} />
        <Row label="Evidencia" value="Foto + firma ✓" />
        <Row label="Hora" value="11:32 a. m." mono />
      </div>

      <Button className="mt-8 h-12 w-full max-w-xs" onClick={onBack}>
        Volver a la ruta
      </Button>
    </div>
  )
}
