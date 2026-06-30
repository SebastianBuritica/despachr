import { Reveal } from '@/components/landing/Reveal'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    n: '01',
    title: 'Planea la ruta',
    desc: 'El coordinador arma rutas, asigna conductores y vehículos y despacha — en minutos.',
    tone: 'muted' as const,
  },
  {
    n: '02',
    title: 'El conductor entrega',
    desc: 'Registra cada parada en vivo y captura el cumplido con foto y firma desde la app.',
    tone: 'solid' as const,
  },
  {
    n: '03',
    title: 'Mides el resultado',
    desc: 'Cumplimiento, toneladas y márgenes se actualizan solos. Decides con datos, no con supuestos.',
    tone: 'tint' as const,
  },
]

const CHIP = {
  muted: 'bg-white/5 border-white/10 text-white',
  solid: 'bg-[#0F6E56] border-[#0F6E56] text-white shadow-[0_8px_24px_-8px_rgba(15,110,86,.7)]',
  tint: 'bg-[#1D9E75]/16 border-[#1D9E75]/40 text-[#1D9E75]',
}

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <Reveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#1D9E75]">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-[40px] sm:leading-tight">
            Operativo en tres pasos
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <span
                className={cn(
                  'flex size-14 items-center justify-center rounded-2xl border font-mono text-lg font-semibold',
                  CHIP[s.tone]
                )}
              >
                {s.n}
              </span>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-white">{s.title}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-[#94A3B8]">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
