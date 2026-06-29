import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Placeholder de Fase 0. Las vistas de coordinador/admin se construyen en Fase 2/3.
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
        <p className="text-sm text-muted-foreground">
          Operación, rutas y métricas — en construcción.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Las vistas de coordinador y administrador se implementan en las siguientes fases.
        </CardContent>
      </Card>
    </div>
  )
}
