import { LogoutButton } from '@/components/auth/LogoutButton'

// Placeholder de Fase 0. El shell real (sidebar oscuro + topbar) llega en Fase 2.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-[62px] items-center justify-between border-b border-border bg-card px-6">
        <span className="font-semibold tracking-tight">Despachr</span>
        <LogoutButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
