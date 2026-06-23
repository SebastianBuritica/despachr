import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex gap-6 p-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
