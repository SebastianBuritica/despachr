import { LogoutButton } from '@/components/auth/LogoutButton'

// Placeholder de Fase 0. El flujo list → active → capture → done llega en Fase 3.
export default function DriverPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between p-4">
        <span className="font-semibold tracking-tight">Mi ruta</span>
        <LogoutButton />
      </header>
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        La app del conductor se implementa en la siguiente fase.
      </div>
    </div>
  )
}
