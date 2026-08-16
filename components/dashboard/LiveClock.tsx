'use client'

import { useSyncExternalStore } from 'react'

// Fecha y hora de la OPERACIÓN (Colombia), no del navegador: una coordinadora
// revisando desde otro huso vería el día equivocado, y `routes.fecha` se compara
// contra este mismo día (misma decisión que `hoyOperacion()` en lib/queries/driver).
const FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
}

function nowInBogota(): string {
  const parts = new Intl.DateTimeFormat('es-CO', FORMAT).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${get('day')} de ${get('month')} · ${get('hour')}:${get('minute')} ${get('dayPeriod')}`
}

// El reloj es una fuente externa mutable, así que se lee con
// useSyncExternalStore en vez de useState+useEffect: la variante con efecto
// obliga a un setState síncrono al montar (que React desaconseja) y a manejar
// la hidratación a mano. Aquí `getServerSnapshot` devuelve null y eso resuelve
// las dos cosas de una vez.
let cached: string | null = null

function getSnapshot(): string {
  const next = nowInBogota()
  // Estabiliza la identidad: sin esto, cada llamada devolvería una cadena nueva
  // y React re-renderizaría en bucle.
  if (next !== cached) cached = next
  return cached
}

// Durante el prerender no hay "ahora" que valga: esta página es ESTÁTICA, así
// que cualquier fecha calculada en el build queda congelada — que es justo cómo
// el subtítulo terminó diciendo "Lunes 15 de enero" en pleno agosto.
function getServerSnapshot(): null {
  return null
}

function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, 30_000)
  return () => clearInterval(timer)
}

export function LiveClock() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Reserva la altura de la línea para que el header no salte al hidratar.
  if (!now) return <span className="inline-block h-[18px]" aria-hidden />

  return <span>{now}</span>
}
