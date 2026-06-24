// ============================================================================
// Despachr — Modelos de dominio (TypeScript)
// Los valores de estado/rol coinciden EXACTAMENTE con los CHECK del schema SQL
// (scripts/schema.sql). Todo en español, alineado al glosario de AGENTS.md.
// ============================================================================

// --- Enums de dominio --------------------------------------------------------

export type RolUsuario = 'admin' | 'coordinador' | 'conductor'

export type EstadoRuta = 'pendiente' | 'en_curso' | 'completada' | 'cancelada'

export type EstadoEntrega =
  | 'pendiente'
  | 'en_punto'
  | 'entregado'
  | 'novedad'
  | 'no_entregado'

export type EstadoPlan = 'borrador' | 'confirmado' | 'en_ejecucion' | 'completado'

export type TipoEvento =
  | 'inicio_ruta'
  | 'llegada_punto'
  | 'salida_punto'
  | 'cumplido'
  | 'novedad'
  | 'fin_ruta'

export type TipoNovedad =
  | 'rechazo'
  | 'faltante'
  | 'danado'
  | 'cliente_ausente'
  | 'direccion_errada'
  | 'otro'

export type EstadoNovedad = 'reportada' | 'pendiente' | 'resuelta'

export type TipoServicio = 'paqueteo' | 'consolidado' | 'exclusivo'

export type EstadoFactura = 'emitida' | 'enviada' | 'pagada' | 'vencida'

// --- Entidades ---------------------------------------------------------------

// Usuario base (extiende auth.users en Supabase → tabla profiles)
export interface User {
  id: string
  email: string
  name: string
  role: RolUsuario
  phone: string
  createdAt: string
  updatedAt: string
}

// Conductor (tercero) — extiende User
export interface Driver extends User {
  role: 'conductor'
  vehicleId: string
  licensePlate: string
  documentNumber: string
}

// Malla semanal (weekly_plans)
export interface WeeklyPlan {
  id: string
  weekStartDate: string
  weekEndDate: string
  estado: EstadoPlan
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Ruta diaria dentro de la malla (routes)
export interface Route {
  id: string
  weeklyPlanId: string
  driverId: string
  date: string
  estado: EstadoRuta
  deliveries: Delivery[]
  createdAt: string
  updatedAt: string
}

// Entrega / punto dentro de una ruta (deliveries)
export interface Delivery {
  id: string
  routeId: string
  clientId: string
  address: string
  latitude: number
  longitude: number
  sequence: number
  // valor_flete = lo que se cobra al cliente (coordinator puede verlo).
  // El pago al transportista y el margen viven en delivery_financials (solo admin).
  valorFlete?: number
  estado: EstadoEntrega
  arrivalTime?: string
  departureTime?: string
  proofPhoto?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Evento en tiempo real del conductor (delivery_events)
export interface Event {
  id: string
  deliveryId: string
  routeId: string
  driverId: string
  tipo: TipoEvento
  timestamp: string
  latitude?: number
  longitude?: number
  metadata?: Record<string, unknown>
  createdAt: string
}

// Cliente / empresa (clients)
export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  department: string
  contactPerson?: string
  tipoServicio?: TipoServicio
  createdAt: string
  updatedAt: string
}

// Novedad detallada (issues)
export interface Issue {
  id: string
  deliveryId: string
  tipo: TipoNovedad
  descripcion: string
  photo?: string
  estado: EstadoNovedad
  createdAt: string
  updatedAt: string
}

// Factura al cliente (client_invoices) — integración Sistran/Cigo. Solo admin.
export interface ClientInvoice {
  id: string
  clientId: string
  weeklyPlanId: string
  numeroFactura?: string
  valorTotal?: number
  estado: EstadoFactura
  fechaEmision?: string
  fechaVencimiento?: string
  createdAt: string
  updatedAt: string
}

// Métricas para el dashboard
export interface Metrics {
  totalDeliveries: number
  completedDeliveries: number
  failedDeliveries: number
  totalDistance: number
  averageDeliveryTime: number
  onTimePercentage: number
  date: string
}
