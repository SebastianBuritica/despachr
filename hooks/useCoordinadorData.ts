'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Carga + Realtime para las pantallas del coordinador.
//
// El coordinador mira este tablero mientras la operación corre: si una entrega
// cambia y él no lo ve, termina llamando por WhatsApp para preguntar — el
// hábito exacto que este producto reemplaza. Se re-lee la consulta completa en
// cada cambio en vez de parchear filas: son decenas de rutas, no miles, y un
// refetch simple no se puede desincronizar del estado derivado (hechas, total,
// retrasada) como sí lo haría un parche granular.
export function useCoordinadorData<T>(cargar: () => Promise<T>, canal: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [syncDown, setSyncDown] = useState(false)
  const [reconnectNonce, setReconnectNonce] = useState(0)

  const load = useCallback(
    async (silent = false) => {
      try {
        setData(await cargar())
      } catch (e) {
        // Un fallo de la recarga por Realtime no debe tumbar la pantalla; el de
        // la carga inicial sí escala a la frontera de error.
        if (!silent) setError(e instanceof Error ? e : new Error('Error al cargar'))
        else console.warn('Recarga por Realtime falló:', e)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [cargar]
  )

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [load])

  useEffect(() => {
    const channel = supabase.channel(canal)
    for (const table of ['routes', 'deliveries', 'delivery_events'] as const) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => load(true))
    }

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSyncDown(false)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setSyncDown(true)
        reconnectTimer = setTimeout(() => setReconnectNonce((n) => n + 1), 3000)
      }
    })

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      supabase.removeChannel(channel)
    }
  }, [canal, load, reconnectNonce])

  return { data, loading, error, syncDown, refetch: load }
}
