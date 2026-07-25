import { DriverSkeleton } from '@/components/driver/DriverSkeleton'

// Carga del conductor (navegación). El mismo esqueleto se usa dentro de
// DriverApp mientras resuelve el fetch de datos en cliente.
export default function DriverLoading() {
  return <DriverSkeleton />
}
