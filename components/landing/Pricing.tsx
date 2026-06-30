import Link from 'next/link'
import { Check } from 'lucide-react'
import { Reveal } from '@/components/landing/Reveal'
import { cn } from '@/lib/utils'

interface Plan {
  name: string
  tagline: string
  price: string
  period?: string
  limit: string
  cta: string
  href: string
  featured?: boolean
  featuresLabel?: string
  features: string[]
}

const PLANS: Plan[] = [
  {
    name: 'Arranque',
    tagline: 'Para transportadoras que empiezan a digitalizar.',
    price: '$290k',
    period: 'COP / mes',
    limit: 'Hasta 5 conductores',
    cta: 'Empezar',
    href: '/login',
    features: [
      'App del conductor',
      'Cumplido digital (foto + firma)',
      'Tablero de operación en vivo',
      'Soporte por correo',
    ],
  },
  {
    name: 'Operación',
    tagline: 'Para flotas en crecimiento que coordinan a diario.',
    price: '$690k',
    period: 'COP / mes',
    limit: 'Hasta 20 conductores',
    cta: 'Acceder ahora',
    href: '/login',
    featured: true,
    featuresLabel: 'Todo lo de Arranque, y además:',
    features: [
      'Mapa en vivo + alertas de retraso',
      'Métricas y rentabilidad por cliente',
      'Reportes exportables',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Flota',
    tagline: 'Para operaciones grandes con varias regionales.',
    price: 'A medida',
    limit: 'Conductores ilimitados',
    cta: 'Hablar con ventas',
    href: '#',
    featuresLabel: 'Todo lo de Operación, y además:',
    features: [
      'Multi-sede y roles avanzados',
      'Integración con tu ERP / facturación',
      'SLA y gerente de cuenta dedicado',
    ],
  },
]

export function Pricing() {
  return (
    <section id="precios" className="scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        <Reveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#1D9E75]">
            Precios
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-[40px] sm:leading-tight">
            Un plan para cada tamaño de flota
          </h2>
          <p className="mt-3 text-[#94A3B8]">
            Sin instalaciones ni contratos largos. Cancela cuando quieras.
          </p>
        </Reveal>

        {/* Toggle decorativo */}
        <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          <span className="rounded-full bg-white px-3.5 py-1.5 font-medium text-[#0A0A0A]">
            Facturación mensual
          </span>
          <span className="px-3.5 py-1.5 text-[#94A3B8]">Anual · 2 meses gratis</span>
        </div>

        <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <Reveal key={p.name}>
              <div
                className={cn(
                  'relative h-full rounded-2xl border p-7',
                  p.featured
                    ? 'border-[#1D9E75]/50 bg-[linear-gradient(#11201A,#0d1512)] shadow-[0_30px_70px_-30px_rgba(15,110,86,.6)]'
                    : 'border-white/10 bg-white/[0.02]'
                )}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#0F6E56] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Más popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="mt-1 min-h-[38px] text-sm leading-snug text-[#94A3B8]">{p.tagline}</p>

                <div className="mt-4 flex items-end gap-1.5">
                  <span className="font-mono text-[38px] font-semibold leading-none tracking-tight text-white">
                    {p.price}
                  </span>
                  {p.period && <span className="mb-1 text-sm text-[#94A3B8]">{p.period}</span>}
                </div>
                <p className="mt-1.5 text-sm text-[#CBD5E1]">{p.limit}</p>

                <Link
                  href={p.href}
                  className={cn(
                    'mt-6 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                    p.featured
                      ? 'bg-[#0F6E56] text-white hover:bg-[#1D9E75]'
                      : 'border border-white/15 text-white hover:bg-white/5'
                  )}
                >
                  {p.cta}
                </Link>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.featuresLabel && (
                    <li className="text-[13px] font-medium text-[#94A3B8]">{p.featuresLabel}</li>
                  )}
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[#CBD5E1]">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1D9E75]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-xs text-[#64748B]">
          Precios de referencia en COP, sin IVA. ¿Una operación distinta? Armamos un plan a tu
          medida.
        </p>
      </div>
    </section>
  )
}
