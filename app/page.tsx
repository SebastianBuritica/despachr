import Link from 'next/link'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { Reveal } from '@/components/landing/Reveal'
import { LiveMapCard } from '@/components/landing/LiveMapCard'
import { DemoMockup } from '@/components/landing/DemoMockup'
import { ProductFeatures } from '@/components/landing/ProductFeatures'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Pricing } from '@/components/landing/Pricing'
import { BrandMark } from '@/components/brand/BrandMark'

const NAV_LINKS = [
  { label: 'Producto', href: '#producto' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Plataforma', href: '#preview' },
  { label: 'Precios', href: '#precios' },
]

export default function LandingPage() {
  return (
    <div className="landing min-h-dvh bg-[#0A0A0A] text-[#FAFAFA] antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0A0A]/70 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-7 text-white" />
            <span className="text-[15px] font-semibold tracking-tight">Despachr</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-[#94A3B8] transition-colors hover:text-white">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D9E75]"
            >
              Acceder
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 size-[600px] rounded-full bg-[#0F6E56]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 size-[500px] rounded-full bg-[#1D9E75]/[0.07] blur-3xl" />
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-26 pt-20 lg:grid-cols-2">
          <div>
            <div className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#94A3B8] [animation-delay:.08s]">
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

            <p className="mt-5 max-w-[480px] animate-fade-up text-lg text-[#94A3B8] [animation-delay:.24s]">
              Conductores, rutas y cumplimiento sincronizados — desde el primer despacho hasta la
              última entrega. Sin llamadas, sin hojas de cálculo.
            </p>

            <div className="mt-7 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:.32s]">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F6E56] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(15,110,86,.7)] transition-colors hover:bg-[#1D9E75]"
              >
                Acceder ahora
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#preview"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                <PlayCircle className="size-4" />
                Ver demo
              </a>
            </div>

            <div className="mt-8 flex animate-fade-up items-center gap-3 [animation-delay:.4s]">
              <div className="flex -space-x-2">
                {['CM', 'AG'].map((a) => (
                  <span
                    key={a}
                    className="flex size-8 items-center justify-center rounded-full border-2 border-[#0A0A0A] bg-[#0F6E56] text-[10px] font-semibold text-white"
                  >
                    {a}
                  </span>
                ))}
                <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#0A0A0A] bg-[#1C1C1F] text-[10px] font-semibold text-[#94A3B8]">
                  +9
                </span>
              </div>
              <p className="max-w-xs text-xs text-[#64748B]">
                Empresas de transporte de carga ya operan con Despachr en Colombia.
              </p>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:.24s]">
            <LiveMapCard />
          </div>
        </div>
      </section>

      {/* Producto (blanco) */}
      <ProductFeatures />

      {/* Cómo funciona (oscuro) */}
      <HowItWorks />

      {/* Plataforma / demo (gris claro) */}
      <section id="preview" className="scroll-mt-20 bg-[#F8FAFC] text-[#0F172A]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <Reveal className="mb-10 max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#1D9E75]">
              La plataforma
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">
              Coordina toda tu flota desde un tablero
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <DemoMockup />
          </Reveal>
        </div>
      </section>

      {/* Precios (oscuro) */}
      <Pricing />

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0F6E56,#0A3D2E)] px-8 py-16 text-center">
          <div className="pointer-events-none absolute -left-10 top-0 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 size-72 rounded-full bg-[#1D9E75]/30 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-[42px]">
              Empieza a operar en tiempo real
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Digitaliza tu operación de carga hoy. Sin instalaciones, sin contratos largos.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0F6E56] transition-colors hover:bg-white/90"
              >
                Empezar ahora
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Hablar con ventas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 text-white" />
            <span className="font-semibold tracking-tight">Despachr</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-[#94A3B8]">
            <a href="#producto" className="transition-colors hover:text-white">Producto</a>
            <a href="#precios" className="transition-colors hover:text-white">Precios</a>
            <a href="#" className="transition-colors hover:text-white">Soporte</a>
            <a href="#" className="transition-colors hover:text-white">Privacidad</a>
          </div>
          <p className="text-xs text-[#64748B]">© 2026 Despachr · Transporte de carga</p>
        </div>
      </footer>
    </div>
  )
}
