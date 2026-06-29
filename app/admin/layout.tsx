import { DashboardShell } from '@/components/layout/DashboardShell'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell variant="admin">{children}</DashboardShell>
}
