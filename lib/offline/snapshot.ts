// Última foto conocida de la ruta del día, para que un arranque en frío SIN
// SEÑAL no deje al conductor sin sus paradas.
//
// EL SERVICE WORKER NO ALCANZA: sirve el shell de la app, pero las entregas
// vienen de Supabase y esas peticiones nunca se cachean a propósito (servir una
// ruta vieja como si fuera la de hoy es peor que no mostrar nada). Este
// snapshot es la versión honesta de lo mismo: se muestra sólo cuando la carga
// FALLA, y la UI dice de cuándo es el dato. El conductor decide si le sirve.
import type { EntregaConductor, RutaDelDia } from '@/lib/queries/driver'
import { STORE_SNAPSHOT, guardarEn, hayIndexedDB, leerDe } from '@/lib/offline/db'

const ID = 'ruta-del-dia'

export interface SnapshotRuta {
  id: typeof ID
  route: RutaDelDia | null
  deliveries: EntregaConductor[]
  guardadoEn: number
}

export async function guardarSnapshot(
  route: RutaDelDia | null,
  deliveries: EntregaConductor[],
  guardadoEn: number
): Promise<void> {
  if (!hayIndexedDB()) return
  try {
    await guardarEn<SnapshotRuta>(STORE_SNAPSHOT, { id: ID, route, deliveries, guardadoEn })
  } catch (e) {
    // Guardar el snapshot es un extra: si falla, la app sigue igual.
    console.warn('No se pudo guardar el snapshot de la ruta:', e)
  }
}

export async function leerSnapshot(): Promise<SnapshotRuta | null> {
  if (!hayIndexedDB()) return null
  try {
    return (await leerDe<SnapshotRuta>(STORE_SNAPSHOT, ID)) ?? null
  } catch {
    return null
  }
}
