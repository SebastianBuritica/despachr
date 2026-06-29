'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { LogoutButton } from '@/components/auth/LogoutButton'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <span className="font-bold text-gray-900 hidden sm:inline">Despachr</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/driver" className="text-gray-700 hover:text-primary-600 transition-colors">
              Conductor
            </Link>
          </nav>
          <LogoutButton />
        </div>

        <button
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Abrir menú"
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 px-6 py-4 flex flex-col gap-3">
          <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/driver" className="text-gray-700 hover:text-primary-600 transition-colors">
            Conductor
          </Link>
          <LogoutButton className="gap-2 justify-start w-fit" />
        </div>
      )}
    </header>
  )
}
