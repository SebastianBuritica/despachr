import { LayoutGrid, Route as RouteIcon, Users, Building2, BarChart3, TrendingUp } from 'lucide-react'

// Mockup del producto en LIGHT (Zinc) dentro de un marco de navegador oscuro.
// Colores explícitos: la landing es oscura, pero el producto se muestra claro.
const NAV = [
  { label: 'Operación en vivo', icon: LayoutGrid, active: true },
  { label: 'Rutas', icon: RouteIcon },
  { label: 'Conductores', icon: Users },
  { label: 'Clientes', icon: Building2 },
  { label: 'Métricas', icon: BarChart3 },
]

const BARS = [
  { d: 'Lun', v: 6.4 },
  { d: 'Mar', v: 7.0 },
  { d: 'Mié', v: 6.9 },
  { d: 'Jue', v: 7.8 },
  { d: 'Vie', v: 8.4 },
]

const ROUTES = [
  { name: 'Costa Atlántica', driver: 'Carlos Martínez', done: 1, total: 3, eta: '15:30', late: false },
  { name: 'Sabana Centro', driver: 'Andrés Gómez', done: 4, total: 6, eta: '16:10', late: false },
  { name: 'Valle del Cauca', driver: 'María Restrepo', done: 2, total: 5, eta: '17:45', late: true },
]

const maxBar = Math.max(...BARS.map((b) => b.v))

export function DemoMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)]">
      {/* Barra del navegador */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#FF5F57]" />
          <span className="size-3 rounded-full bg-[#FEBC2E]" />
          <span className="size-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="mx-auto rounded-md bg-white/5 px-3 py-1 font-mono text-xs text-zinc-400">
          app.despachr.co/operacion
        </div>
      </div>

      {/* Producto en light Zinc */}
      <div className="flex bg-[#FAFAFA] text-[#18181B]">
        {/* Sidebar claro */}
        <aside className="hidden w-[180px] shrink-0 flex-col gap-1 border-r border-[#E4E4E7] p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#0F6E56] text-white">
              <RouteIcon className="size-3.5" />
            </span>
            <span className="text-sm font-semibold">Despachr</span>
          </div>
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <div
                key={n.label}
                className={
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] ' +
                  (n.active
                    ? 'bg-[#F0F0F1] font-semibold text-[#18181B]'
                    : 'font-medium text-[#52525B]')
                }
              >
                <Icon className={'size-4 ' + (n.active ? 'text-[#0F6E56]' : '')} />
                {n.label}
              </div>
            )
          })}
        </aside>

        {/* Contenido */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold tracking-tight">Operación en vivo</h3>
            <p className="text-xs text-[#71717A]">Lunes 15 de enero · actualizado hace 12 s</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Kpi label="En ruta" value="12" hint="▲ 8 hoy" accent />
            <Kpi label="Completadas" value="84" hint="92% del plan" />
            <Kpi label="Paradas hoy" value="142" hint="38 t movilizadas" />
            <Kpi label="Retrasadas" value="2" hint="SLA 98.6%" danger />
          </div>

          {/* Chart + donut */}
          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-lg border border-[#E4E4E7] bg-white p-3">
              <p className="mb-2 text-xs font-semibold">Toneladas movilizadas por día</p>
              <div className="flex h-[110px] items-end gap-2 border-b border-[#E4E4E7]">
                {BARS.map((b) => {
                  const peak = b.v === maxBar
                  return (
                    <div key={b.d} className="flex h-full flex-1 flex-col items-center gap-1">
                      <span className="font-mono text-[10px] text-[#71717A]">{b.v}</span>
                      <div className="flex w-full flex-1 items-end justify-center">
                        <div
                          className={'w-[60%] max-w-[22px] rounded-t-[4px] bg-[#0F6E56] ' + (peak ? 'opacity-100' : 'opacity-50')}
                          style={{ height: `${(b.v / maxBar) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-1.5 flex gap-2">
                {BARS.map((b) => (
                  <span key={b.d} className="flex-1 text-center text-[10px] text-[#A1A1AA]">
                    {b.d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border border-[#E4E4E7] bg-white p-3">
              <p className="mb-2 self-start text-xs font-semibold">Cumplimiento global</p>
              <div
                className="flex size-24 items-center justify-center rounded-full"
                style={{ background: 'conic-gradient(#1D9E75 0 94.8%, #E4E4E7 94.8% 100%)' }}
              >
                <div className="flex size-16 flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-mono text-sm font-semibold">94.8%</span>
                  <span className="text-[9px] text-[#71717A]">a tiempo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla rutas activas */}
          <div className="mt-2.5 overflow-hidden rounded-lg border border-[#E4E4E7] bg-white">
            <div className="border-b border-[#E4E4E7] px-3 py-2 text-xs font-semibold">Rutas activas</div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#F1F1F3] text-[10px] uppercase tracking-wide text-[#71717A]">
                  <th className="px-3 py-2 text-left font-semibold">Ruta</th>
                  <th className="hidden px-3 py-2 text-left font-semibold sm:table-cell">Conductor</th>
                  <th className="px-3 py-2 text-left font-semibold">Progreso</th>
                  <th className="hidden px-3 py-2 text-left font-semibold sm:table-cell">ETA</th>
                  <th className="px-3 py-2 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((r) => (
                  <tr key={r.name} className="border-b border-[#F1F1F3] last:border-0">
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="hidden px-3 py-2 text-[#3F3F46] sm:table-cell">{r.driver}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#F4F4F5]">
                          <div
                            className={'h-full rounded-full ' + (r.late ? 'bg-[#DC2626]' : 'bg-[#0F6E56]')}
                            style={{ width: `${(r.done / r.total) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-[#71717A]">
                          {r.done}/{r.total}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-3 py-2 font-mono text-[11px] sm:table-cell">{r.eta}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ' +
                          (r.late ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#15803D]')
                        }
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {r.late ? 'Retrasada' : 'En ruta'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  hint,
  accent,
  danger,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div
      className={
        'rounded-lg border p-3 ' +
        (danger ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E4E4E7] bg-white')
      }
    >
      <p className="text-[11px] text-[#71717A]">{label}</p>
      <p
        className={
          'mt-1 font-mono text-2xl font-semibold tabular-nums ' +
          (accent ? 'text-[#0F6E56]' : danger ? 'text-[#DC2626]' : 'text-[#18181B]')
        }
      >
        {value}
      </p>
      <p className={'mt-0.5 text-[10px] ' + (danger ? 'text-[#DC2626]' : 'text-[#71717A]')}>{hint}</p>
    </div>
  )
}
