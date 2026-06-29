// Placeholder de Fase 0. La app del conductor (mobile-first) se construye en Fase 3.
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {children}
    </div>
  )
}
