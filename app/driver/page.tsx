import { RouteList } from '@/components/driver/RouteList'
import { Card, CardContent } from '@/components/ui/Card'
import type { Route } from '@/types'

export default function DriverPage() {
  const mockRoutes: Route[] = []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Ruta del Día</h1>
        <p className="text-gray-600 mt-1">Gestiona tus entregas desde el móvil</p>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Estado General</span>
              <span className="text-sm text-gray-600">0 / 0 completadas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: '0%' }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RouteList routes={mockRoutes} />
    </div>
  )
}
