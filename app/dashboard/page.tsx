import { StatsCard } from '@/components/dashboard/StatsCard'
import { RouteMap } from '@/components/dashboard/RouteMap'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Activity, Truck, Package, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al panel de control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Entregas Completadas"
          value="156"
          icon={<Package className="w-6 h-6" />}
          trend={{ value: 12, direction: 'up' }}
        />
        <StatsCard
          title="Conductores Activos"
          value="23"
          icon={<Truck className="w-6 h-6" />}
          trend={{ value: 5, direction: 'down' }}
        />
        <StatsCard
          title="Rutas en Progreso"
          value="45"
          icon={<Activity className="w-6 h-6" />}
        />
        <StatsCard
          title="Cumplimiento"
          value="94.2%"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 2.3, direction: 'up' }}
        />
      </div>

      <div>
        <RouteMap />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entregas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No hay datos disponibles aún
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
