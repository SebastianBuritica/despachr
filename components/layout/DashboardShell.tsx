'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutGrid,
  Route as RouteIcon,
  Users,
  Building2,
  BarChart3,
  Receipt,
  FileText,
  Truck,
  Bell,
  Search,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PeriodToggle } from '@/components/dashboard/PeriodToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ShellVariant = 'coordinator' | 'admin'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const NAV: Record<ShellVariant, { section: string; items: NavItem[] }> = {
  coordinator: {
    section: 'Operación',
    items: [
      { label: 'Operación en vivo', href: '/dashboard', icon: LayoutGrid, exact: true },
      { label: 'Rutas', href: '/dashboard/rutas', icon: RouteIcon },
      { label: 'Conductores', href: '/dashboard/conductores', icon: Users },
      { label: 'Clientes', href: '/dashboard/clientes', icon: Building2 },
    ],
  },
  admin: {
    section: 'Administración',
    items: [
      { label: 'Métricas', href: '/admin', icon: BarChart3, exact: true },
      { label: 'Clientes', href: '/admin/clientes', icon: Building2 },
      { label: 'Facturación', href: '/admin/facturacion', icon: Receipt },
      { label: 'Reportes', href: '/admin/reportes', icon: FileText },
    ],
  },
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  coordinador: 'Coordinadora',
  conductor: 'Conductor',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '—'
}

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

export function DashboardShell({
  variant,
  children,
}: {
  variant: ShellVariant
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const { section, items } = NAV[variant]

  const name = profile?.name ?? 'Usuario'
  const roleLabel = profile?.role ? ROLE_LABEL[profile.role] : '—'

  return (
    <div className="min-h-dvh bg-background p-4">
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-[1320px] overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
        {/* Sidebar */}
        <aside className="flex w-[236px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span className="flex size-7 items-center justify-center rounded-[7px] bg-brand text-white">
              <Truck className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Despachr</span>
          </div>

          <p className="px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {section}
          </p>

          <nav className="flex flex-col gap-1 px-3">
            {items.map((item) => {
              const active = isActive(pathname, item)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-white'
                      : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white'
                  )}
                >
                  <Icon className="size-[17px] shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto p-3">
            <UserCard name={name} roleLabel={roleLabel} />
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar variant={variant} pathname={pathname} />
          <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

function Topbar({ variant, pathname }: { variant: ShellVariant; pathname: string }) {
  if (variant === 'admin') {
    return (
      <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <span className="text-sm font-medium text-muted-foreground">Administración</span>
        {pathname === '/admin' && <PeriodToggle />}
      </header>
    )
  }

  return (
    <header className="flex h-[62px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="flex h-9 w-[300px] items-center gap-2 rounded-full bg-muted px-3 text-sm text-muted-foreground">
        <Search className="size-4" />
        <span className="truncate">Buscar ruta, conductor o cliente…</span>
      </div>
      <button
        type="button"
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Notificaciones"
      >
        <Bell className="size-[18px]" />
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
          3
        </span>
      </button>
    </header>
  )
}

function UserCard({ name, roleLabel }: { name: string; roleLabel: string }) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-hover"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand text-xs font-semibold text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">{name}</span>
            <span className="block truncate text-xs text-sidebar-muted">{roleLabel}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-[200px]">
        <DropdownMenuItem onClick={handleLogout} disabled={loading} variant="destructive">
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
