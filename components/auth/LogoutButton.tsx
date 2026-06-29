'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Salir
    </Button>
  )
}
