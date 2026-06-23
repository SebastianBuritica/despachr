'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function RouteMap() {
  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle>Rutas en Tiempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-gray-500">Mapa interactivo - Integraci'ón con Google Maps/Mapbox próximamente</p>
        </div>
      </CardContent>
    </Card>
  )
}
