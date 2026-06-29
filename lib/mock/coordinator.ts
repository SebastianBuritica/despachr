// Datos estáticos del prototipo (handoff). En producción vienen de Supabase/API.
import type { StatusTone } from '@/components/ui/status-badge'

export type RouteStatus = 'en_ruta' | 'completada' | 'programada' | 'retrasada'

export const ROUTE_STATUS: Record<RouteStatus, { label: string; tone: StatusTone }> = {
  en_ruta: { label: 'En ruta', tone: 'success' },
  completada: { label: 'Completada', tone: 'neutral' },
  programada: { label: 'Programada', tone: 'warning' },
  retrasada: { label: 'Retrasada', tone: 'danger' },
}

export interface ActiveRoute {
  id: string
  name: string
  driver: string
  plate: string
  zone: string
  done: number
  total: number
  departure: string
  eta: string
  status: RouteStatus
}

export const ACTIVE_ROUTES: ActiveRoute[] = [
  {
    id: 'r1',
    name: 'Ruta Costa Atlántica',
    driver: 'Carlos Martínez',
    plate: 'ABC-123',
    zone: 'Atlántico · Córdoba',
    done: 1,
    total: 3,
    departure: '06:00',
    eta: '15:30',
    status: 'en_ruta',
  },
  {
    id: 'r2',
    name: 'Ruta Sabana Centro',
    driver: 'Andrés Gómez',
    plate: 'DEF-456',
    zone: 'Cundinamarca',
    done: 4,
    total: 6,
    departure: '05:30',
    eta: '16:10',
    status: 'en_ruta',
  },
  {
    id: 'r3',
    name: 'Ruta Eje Cafetero',
    driver: 'Luis Herrera',
    plate: 'GHI-789',
    zone: 'Risaralda · Caldas',
    done: 6,
    total: 6,
    departure: '04:45',
    eta: '13:20',
    status: 'completada',
  },
  {
    id: 'r4',
    name: 'Ruta Valle del Cauca',
    driver: 'María Restrepo',
    plate: 'JKL-012',
    zone: 'Valle',
    done: 2,
    total: 5,
    departure: '06:15',
    eta: '17:40',
    status: 'retrasada',
  },
  {
    id: 'r5',
    name: 'Ruta Santander',
    driver: 'Jorge Niño',
    plate: 'MNO-345',
    zone: 'Santander',
    done: 0,
    total: 4,
    departure: '07:00',
    eta: '18:00',
    status: 'programada',
  },
  {
    id: 'r6',
    name: 'Ruta Antioquia Sur',
    driver: 'Diana Cruz',
    plate: 'PQR-678',
    zone: 'Antioquia',
    done: 3,
    total: 3,
    departure: '05:00',
    eta: '12:30',
    status: 'completada',
  },
]

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
