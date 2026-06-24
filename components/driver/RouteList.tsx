'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Route } from '@/types'

interface RouteListProps {
  routes: Route[]
}

export function RouteList({ routes }: RouteListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mis Rutas</h3>
      {routes.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">No hay rutas asignadas</p>
        </Card>
      ) : (
        routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <CardTitle className="text-base">Ruta {route.date}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{route.deliveries.length} entregas</span>
                <Badge variant={route.estado === 'completada' ? 'success' : 'default'}>
                  {route.estado}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
