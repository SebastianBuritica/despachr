import { Smartphone, MapPin, ScanText, Sparkles, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/landing/Reveal'

interface Feature {
  icon: LucideIcon
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  {
    icon: ScanText,
    title: 'Cumplido leído por IA',
    desc: 'Sube el lote de facturas selladas a mano y la IA lee fecha de entrega, quién recibió y novedades. Si no puede leer algo con certeza, lo dice — nunca inventa un dato.',
  },
  {
    icon: Sparkles,
    title: 'Informe redactado solo',
    desc: 'El cumplimiento semanal por cliente, hoy armado filtrando un Excel a mano, sale calculado y redactado — listo para exportar en el formato exacto que tu cliente espera.',
  },
  {
    icon: Smartphone,
    title: 'App del conductor',
    desc: 'Lista de entregas, navegación, timer en sitio y captura de cumplido con foto y firma — todo desde el celular, incluso sin señal.',
  },
  {
    icon: MapPin,
    title: 'Coordinación en vivo',
    desc: 'Mapa con todas las rutas, estado de cada parada y alertas automáticas de retrasos o entregas fuera de ventana.',
  },
]

export function ProductFeatures() {
  return (
    <section id="producto" className="scroll-mt-20 bg-white text-[#0F172A]">
      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <Reveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#1D9E75]">
            Una sola plataforma
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">
            Del documento que llega por un canal informal al informe que se entrega solo
          </h2>
          <p className="mt-3 text-[#64748B]">
            Cada agente le quita un salto de transcripción manual a tu back-office — sin importar
            si el documento llega por WhatsApp, correo o papel.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group h-full rounded-[14px] border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-all hover:border-[#1D9E75] hover:shadow-[0_20px_50px_-24px_rgba(15,23,42,.25)]">
                  <span className="flex size-[46px] items-center justify-center rounded-xl bg-[#DCFCE7] text-[#0F6E56]">
                    <Icon className="size-[22px]" />
                  </span>
                  <h3 className="mt-4 text-[19px] font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#64748B]">{f.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
