'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  LayoutGrid,
  Route as RouteIcon,
  Users,
  Building2,
  BarChart3,
  Receipt,
  FileText,
  Bell,
  Search,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PeriodToggle } from '@/components/dashboard/PeriodToggle'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { BrandMark } from '@/components/brand/BrandMark'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ComingSoon } from '@/components/ui/coming-soon'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const name = profile?.name ?? 'Usuario'
  const roleLabel = profile?.role ? ROLE_LABEL[profile.role] : '—'

  const sidebar = (
    <SidebarNav
      section={section}
      items={items}
      pathname={pathname}
      name={name}
      roleLabel={roleLabel}
      onNavigate={() => setMobileOpen(false)}
    />
  )

  return (
    <div className="min-h-dvh bg-background p-4">
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-[1320px] overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-[236px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          {sidebar}
        </aside>

        {/* Sidebar (mobile drawer) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            aria-describedby={undefined}
            className="flex w-[236px] flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar variant={variant} pathname={pathname} onOpenMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

function SidebarNav({
  section,
  items,
  pathname,
  name,
  roleLabel,
  onNavigate,
}: {
  section: string
  items: NavItem[]
  pathname: string
  name: string
  roleLabel: string
  onNavigate: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BrandMark className="h-6 text-brand-ink" />
        <span className="text-[15px] font-semibold tracking-tight">Despachr</span>
      </div>

      <p className="px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
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
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                  : 'font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('size-[17px] shrink-0', active && 'text-brand-ink')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-3">
        <UserCard name={name} roleLabel={roleLabel} />
      </div>
    </>
  )
}

function MenuButton({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenMenu}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted md:hidden"
      aria-label="Abrir menú"
    >
      <Menu className="size-[18px]" />
    </button>
  )
}

function Topbar({
  variant,
  pathname,
  onOpenMenu,
}: {
  variant: ShellVariant
  pathname: string
  onOpenMenu: () => void
}) {
  if (variant === 'admin') {
    return (
      <header className="flex h-[62px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
        <div className="flex items-center gap-2">
          <MenuButton onOpenMenu={onOpenMenu} />
          <span className="text-sm font-medium text-muted-foreground">Administración</span>
        </div>
        <div className="flex items-center gap-3">
          {pathname === '/admin' && <PeriodToggle />}
          <ThemeToggle />
        </div>
      </header>
    )
  }

  return (
    <header className="flex h-[62px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MenuButton onOpenMenu={onOpenMenu} />
        <ComingSoon className="hidden max-w-full sm:inline-flex" label="Búsqueda — próximamente">
          <div className="flex h-9 w-[300px] max-w-full items-center gap-2 rounded-full bg-muted px-3 text-sm text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <span className="truncate">Buscar ruta, conductor o cliente…</span>
          </div>
        </ComingSoon>
      </div>
      <div className="flex items-center gap-2">
        <ComingSoon label="Notificaciones — próximamente">
          <button
            type="button"
            disabled
            className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            aria-label="Notificaciones"
          >
            <Bell className="size-[18px]" />
          </button>
        </ComingSoon>
        <ThemeToggle />
      </div>
    </header>
  )
}

function UserCard({ name, roleLabel }: { name: string; roleLabel: string }) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      router.replace('/login')
      router.refresh()
    } catch {
      toast.error('No se pudo cerrar sesión. Inténtalo de nuevo.')
      setLoading(false)
    }
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
            <span className="block truncate text-sm font-medium text-sidebar-foreground">{name}</span>
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
