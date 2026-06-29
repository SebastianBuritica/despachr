'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await signOut()
    // refresh() revalida el middleware (server) con la sesión ya cerrada.
    router.replace('/login')
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className ?? 'gap-2'}
      onClick={handleLogout}
      loading={loading}
    >
      <LogOut className="w-4 h-4" />
      Salir
    </Button>
  )
}
