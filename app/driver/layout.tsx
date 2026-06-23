import { Header } from '@/components/layout/Header'

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
