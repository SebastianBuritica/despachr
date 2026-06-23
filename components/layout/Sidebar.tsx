'use client'

import Link from 'next/link'
import { BarChart3, Users, MapPin, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/routes', label: 'Rutas', icon: MapPin },
  { href: '/dashboard/drivers', label: 'Conductores', icon: Users },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-6">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
