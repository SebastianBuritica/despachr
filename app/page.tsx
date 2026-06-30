import Link from 'next/link'
import { Truck, ArrowRight, Play } from 'lucide-react'
import { CountUp } from '@/components/landing/CountUp'
import { Reveal } from '@/components/landing/Reveal'
import { LiveMapCard } from '@/components/landing/LiveMapCard'
import { DemoMockup } from '@/components/landing/DemoMockup'

const NAV_LINKS = ['Producto', 'Cómo funciona', 'Plataforma', 'Precios']

const STATS = [
  { value: 94.8, decimals: 1, suffix: '%', label: 'Cumplimiento de entrega' },
  { value: 48.3, decimals: 1, suffix: ' T', label: 'Movilizadas por semana' },
  { value: 1200, decimals: 0, prefix: '+', label: 'Rutas completadas / mes' },
  { value: 23.6, decimals: 1, suffix: '%', label: 'Margen promedio' },
]

export default function LandingPage() {
  return (
    <div className="landing min-h-dvh bg-[#0A0C0B] text-[#FAFAFA] antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0C0B]/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#0F6E56] text-white">
              <Truck className="size-[18px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Despachr</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l} href="#" className="text-sm text-[#A1A1AA] transition-colors hover:text-white">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#A1A1AA] transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0A5A45]"
            >
              Acceder
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/3 size-[600px] rounded-full bg-[#0F6E56]/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#A1A1AA] [animation-delay:.08s]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1D9E75]/70" />
                <span className="relative inline-flex size-2 rounded-full bg-[#1D9E75]" />
              </span>
              Plataforma logística en tiempo real
            </div>

            <h1 className="mt-5 animate-fade-up text-[44px] font-extrabold leading-[1.05] tracking-tight [animation-delay:.16s] sm:text-[60px]">
              Toda tu operación de carga,{' '}
              <span className="text-[#1D9E75]">en tiempo real.</span>
            </h1>

            <p className="mt-5 max-w-xl animate-fade-up text-lg text-[#A1A1AA] [animation-delay:.24s]">
              Conductores, rutas y cumplimiento sincronizados — desde el primer despacho hasta la
              última entrega. Sin llamadas, sin hojas de cálculo.
            </p>

            <div className="mt-7 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:.32s]">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F6E56] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(15,110,86,.7)] transition-colors hover:bg-[#0A5A45]"
              >
                Acceder ahora
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                <Play className="size-4" />
                Ver demo
              </a>
            </div>

            <div className="mt-8 flex animate-fade-up items-center gap-3 [animation-delay:.4s]">
              <div className="flex -space-x-2">
                {['CM', 'AG'].map((a) => (
                  <span
                    key={a}
                    className="flex size-8 items-center justify-center rounded-full border-2 border-[#0A0C0B] bg-[#0F6E56] text-[10px] font-semibold text-white"
                  >
                    {a}
                  </span>
                ))}
                <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#0A0C0B] bg-[#1C1C1F] text-[10px] font-semibold text-[#A1A1AA]">
                  +9
                </span>
              </div>
              <p className="max-w-xs text-xs text-[#71717A]">
                Empresas de transporte de carga ya operan con Despachr en Colombia.
              </p>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:.24s]">
            <LiveMapCard />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-semibold text-white sm:text-4xl">
                <CountUp value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-1.5 text-sm text-[#A1A1AA]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-semibold text-[#1D9E75]">La plataforma</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Tu operación, en una sola pantalla
          </h2>
          <p className="mt-3 text-[#A1A1AA]">
            Marketing oscuro, producto claro. Así se ve el panel de operación en vivo que usan tus
            coordinadores cada día.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <DemoMockup />
        </Reveal>
      </section>

      {/* CTA de cierre */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] px-8 py-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full bg-[#0F6E56]/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-[42px]">
              Empieza a operar en tiempo real
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#A1A1AA]">
              Digitaliza tu operación de carga hoy. Sin instalaciones, sin contratos largos.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F6E56] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A5A45]"
              >
                Empezar ahora
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                Hablar con ventas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-[#0F6E56] text-white">
              <Truck className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">Despachr</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-[#A1A1AA]">
            {['Producto', 'Precios', 'Soporte', 'Privacidad'].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-white">
                {l}
              </a>
            ))}
          </div>
          <p className="text-xs text-[#71717A]">© 2026 Despachr · Transporte de carga</p>
        </div>
      </footer>
    </div>
  )
}
