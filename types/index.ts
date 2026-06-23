// User roles
export type UserRole = 'admin' | 'coordinator' | 'driver'

// Base user type
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone: string
  createdAt: string
  updatedAt: string
}

// Driver specific
export interface Driver extends User {
  role: 'driver'
  vehicleId: string
  licensePlate: string
  documentNumber: string
}

// Route for a driver
export interface Route {
  id: string
  driverId: string
  date: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  deliveries: Delivery[]
  createdAt: string
  updatedAt: string
}

// Individual delivery/stop
export interface Delivery {
  id: string
  routeId: string
  clientId: string
  address: string
  latitude: number
  longitude: number
  sequence: number
  status: 'pending' | 'arrived' | 'completed' | 'failed'
  arrivalTime?: string
  departureTime?: string
  proofPhoto?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Event tracking (arrival, departure, etc)
export interface Event {
  id: string
  deliveryId: string
  type: 'arrival' | 'departure' | 'photo_captured' | 'note_added'
  timestamp: string
  latitude?: number
  longitude?: number
  metadata?: Record<string, unknown>
  createdAt: string
}

// Client/customer
export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  department: string
  contactPerson?: string
  createdAt: string
  updatedAt: string
}

// Incident/issue during delivery
export interface Issue {
  id: string
  deliveryId: string
  type: 'wrong_address' | 'client_not_found' | 'damaged_package' | 'access_denied' | 'other'
  description: string
  photo?: string
  status: 'reported' | 'resolved' | 'pending'
  createdAt: string
  updatedAt: string
}

// Metrics for dashboard
export interface Metrics {
  totalDeliveries: number
  completedDeliveries: number
  failedDeliveries: number
  totalDistance: number
  averageDeliveryTime: number
  onTimePercentage: number
  date: string
}
