'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MapPin } from 'lucide-react'
import type { Delivery } from '@/types'

interface DeliveryCardProps {
  delivery: Delivery
  onArrive?: () => void
  onComplete?: () => void
}

export function DeliveryCard({ delivery, onArrive, onComplete }: DeliveryCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{delivery.address}</p>
                  <p className="text-sm text-gray-600">#{delivery.sequence}</p>
                </div>
              </div>
            </div>
            <Badge variant={delivery.estado === 'entregado' ? 'success' : 'default'}>
              {delivery.estado}
            </Badge>
          </div>

          {delivery.notes && <p className="text-sm text-gray-600 italic">{delivery.notes}</p>}

          <div className="flex gap-2">
            {delivery.estado === 'pendiente' && onArrive && (
              <Button size="sm" onClick={onArrive} className="flex-1">
                Llegué
              </Button>
            )}
            {delivery.estado === 'en_punto' && onComplete && (
              <Button size="sm" onClick={onComplete} className="flex-1">
                Completar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
