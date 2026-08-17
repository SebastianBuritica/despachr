// Lo ÚNICO que queda mock del coordinador: las alertas.
//
// El resto (rutas, conductores, clientes) ya lee de Supabase vía
// `lib/queries/coordinator.ts`. La tabla `alerts` existe y su RLS ya permite al
// coordinador leerla y resolverla, pero se llena desde la edge function
// check-tiempo-en-punto, que está pendiente de desplegar — conectarla es E.2.
import type { StatusTone } from '@/components/ui/status-badge'

export interface LiveAlert {
  id: string
  tone: Extract<StatusTone, 'danger' | 'warning'>
  title: string
  detail: string
}

export const LIVE_ALERTS: LiveAlert[] = [
  {
    id: 'a1',
    tone: 'danger',
    title: 'Ruta Valle del Cauca retrasada',
    detail: '35 min sobre lo estimado · María Restrepo',
  },
  {
    id: 'a2',
    tone: 'warning',
    title: 'Parada prolongada en Makro Montería',
    detail: '52 min en sitio · Carlos Martínez',
  },
  {
    id: 'a3',
    tone: 'warning',
    title: 'Ventana de entrega por vencer',
    detail: 'Olímpica Soledad · cierra 13:30',
  },
]

export interface DriverCard {
  id: string
  name: string
  plate: string
  route: string | null
  onRoute: boolean
  done: number
  total: number
  compliance: number
  rating: number
}

export const DRIVERS: DriverCard[] = [
  { id: 'd1', name: 'Carlos Martínez', plate: 'ABC-123', route: 'Ruta Costa Atlántica', onRoute: true, done: 1, total: 3, compliance: 96, rating: 4.9 },
  { id: 'd2', name: 'Andrés Gómez', plate: 'DEF-456', route: 'Ruta Sabana Centro', onRoute: true, done: 4, total: 6, compliance: 93, rating: 4.7 },
  { id: 'd3', name: 'Luis Herrera', plate: 'GHI-789', route: 'Ruta Eje Cafetero', onRoute: true, done: 6, total: 6, compliance: 98, rating: 4.8 },
  { id: 'd4', name: 'María Restrepo', plate: 'JKL-012', route: 'Ruta Valle del Cauca', onRoute: true, done: 2, total: 5, compliance: 89, rating: 4.5 },
  { id: 'd5', name: 'Jorge Niño', plate: 'MNO-345', route: null, onRoute: false, done: 0, total: 0, compliance: 91, rating: 4.6 },
  { id: 'd6', name: 'Diana Cruz', plate: 'PQR-678', route: null, onRoute: false, done: 3, total: 3, compliance: 94, rating: 4.7 },
]

export interface ClientRow {
  id: string
  name: string
  city: string
  routes: number
  monthlyDeliveries: number
  onTime: number
  nextDelivery: string
  active: boolean
}

export const CLIENTS: ClientRow[] = [
  { id: 'c1', name: 'Makro Montería', city: 'Montería', routes: 1, monthlyDeliveries: 42, onTime: 95, nextDelivery: 'Hoy 14:00', active: true },
  { id: 'c2', name: 'Grupo Éxito Barranquilla', city: 'Barranquilla', routes: 2, monthlyDeliveries: 68, onTime: 92, nextDelivery: 'Hoy 11:00', active: true },
  { id: 'c3', name: 'Olímpica Soledad', city: 'Soledad', routes: 1, monthlyDeliveries: 24, onTime: 88, nextDelivery: 'Hoy 13:30', active: true },
  { id: 'c4', name: 'Tiendas D1 Cali', city: 'Cali', routes: 3, monthlyDeliveries: 51, onTime: 90, nextDelivery: 'Mañana 08:00', active: true },
  { id: 'c5', name: 'Justo & Bueno Medellín', city: 'Medellín', routes: 1, monthlyDeliveries: 18, onTime: 86, nextDelivery: 'Mañana 09:00', active: false },
]
