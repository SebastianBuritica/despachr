// Datos estáticos del prototipo (app del conductor). En producción vienen de API.
import type { StatusTone } from '@/components/ui/status-badge'

export type DeliveryStatus = 'delivered' | 'onsite' | 'pending'

export const DELIVERY_STATUS: Record<DeliveryStatus, { label: string; tone: StatusTone }> = {
  delivered: { label: 'Entregada', tone: 'success' },
  onsite: { label: 'En punto', tone: 'warning' },
  pending: { label: 'Pendiente', tone: 'neutral' },
}

export interface DriverDelivery {
  id: string
  client: string
  address: string
  city: string
  window: string
  tons: string
  units: string
  status: DeliveryStatus
}

export const DRIVER_ROUTE = {
  name: 'Ruta Costa Atlántica',
  date: 'Lunes 15 de enero',
  driver: 'Carlos Martínez',
  plate: 'ABC-123',
  initials: 'CM',
}

export const DRIVER_DELIVERIES: DriverDelivery[] = [
  {
    id: 'e1',
    client: 'Makro Montería',
    address: 'Cra 6 #45-12, Zona Industrial',
    city: 'Montería, Córdoba',
    window: '07:00 – 09:00',
    tons: '12.5 T',
    units: '18 pallets',
    status: 'delivered',
  },
  {
    id: 'e2',
    client: 'Grupo Éxito Barranquilla',
    address: 'Cll 30 #1-850, Bodega 4',
    city: 'Barranquilla, Atlántico',
    window: '10:00 – 12:00',
    tons: '8.2 T',
    units: '12 pallets',
    status: 'onsite',
  },
  {
    id: 'e3',
    client: 'Olímpica Soledad',
    address: 'Cll 18 #28-40, Patio 2',
    city: 'Soledad, Atlántico',
    window: '13:00 – 15:00',
    tons: '6.4 T',
    units: '9 pallets',
    status: 'pending',
  },
]
