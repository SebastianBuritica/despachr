import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

// Marca una pantalla que todavía lee de `lib/mock/*` en vez de Supabase.
//
// POR QUÉ EXISTE: la misma lógica que <ComingSoon> aplicada al DATO en vez de
// al control. Un CTA muerto se nota; una métrica inventada no — se lee idéntica
// a una real. Sin esta marca, cualquiera que abra el panel (el dueño, la
// coordinadora, un cliente al que se le muestre) toma decisiones sobre cifras
// que no existen, o reporta como bug una diferencia que no lo es.
//
// CÓMO SE RETIRA: no es global a propósito. Va pantalla por pantalla, así que
// al conectar cada vista en la Fase 2 se borra sólo la línea de esa página y
// las demás siguen marcadas honestamente. Si algún día no queda ninguna
// importación, este archivo se borra.
export function DemoDataNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px]',
        'border-[#FDE68A] bg-[#FEF9C3] text-[#B45309]',
        'dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-[#FBBF24]',
        className
      )}
    >
      <FlaskConical className="mt-px size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Datos de demostración.</span> Esta pantalla todavía no está
        conectada a la base de datos: las cifras son de ejemplo y no reflejan la operación real.
      </p>
    </div>
  )
}
