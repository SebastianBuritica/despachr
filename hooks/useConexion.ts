'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { contarPendientes } from '@/lib/offline/cola'
import { sincronizar } from '@/lib/offline/sync'

// `navigator.onLine` es una fuente externa mutable → useSyncExternalStore. Se
// evita así el setState síncrono en efecto y el desajuste de hidratación: en el
// servidor se asume `true` (el prerender no sabe nada de la red del conductor).
//
// LÍMITE CONOCIDO: onLine sólo dice si hay interfaz de red, no si hay internet.
// Un celular pegado a una antena sin backhaul reporta `true`. Por eso el envío
// directo se intenta igual y la cola es el respaldo cuando falla — la señal de
// verdad es que la petición no pasó, no lo que diga el navegador.
function suscribir(alCambiar: () => void): () => void {
  window.addEventListener('online', alCambiar)
  window.addEventListener('offline', alCambiar)
  return () => {
    window.removeEventListener('online', alCambiar)
    window.removeEventListener('offline', alCambiar)
  }
}

const REINTENTO_MS = 30_000

export function useConexion() {
  const online = useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true
  )

  const [pendientes, setPendientes] = useState(0)

  const refrescarPendientes = useCallback(async () => {
    try {
      setPendientes(await contarPendientes())
    } catch {
      // Sin IndexedDB (navegador viejo, modo privado): la app sigue, sin cola.
      setPendientes(0)
    }
  }, [])

  const sincronizarAhora = useCallback(async (): Promise<number> => {
    try {
      const r = await sincronizar()
      await refrescarPendientes()
      return r.enviados
    } catch {
      await refrescarPendientes()
      return 0
    }
  }, [refrescarPendientes])

  // Conteo inicial. La IIFE async evita el setState síncrono en el efecto.
  useEffect(() => {
    void (async () => {
      await refrescarPendientes()
    })()
  }, [refrescarPendientes])

  // Al volver la señal, vaciar la cola. Y reintentar cada 30 s mientras quede
  // algo: `online` puede ser true sin internet real, así que no basta el evento.
  useEffect(() => {
    if (!online || pendientes === 0) return
    void (async () => {
      await sincronizarAhora()
    })()
    const timer = setInterval(() => void sincronizarAhora(), REINTENTO_MS)
    return () => clearInterval(timer)
  }, [online, pendientes, sincronizarAhora])

  return { online, pendientes, refrescarPendientes, sincronizarAhora }
}
