'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/lib/supabase'
import type { RolUsuario } from '@/types'

function homeForRole(role: RolUsuario | null): string {
  return role === 'conductor' ? '/driver' : '/dashboard'
}

// Traduce los errores de Supabase Auth a mensajes claros en español.
function authErrorMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Tu correo aún no ha sido verificado.'
  return 'No fue posible iniciar sesión. Inténtalo de nuevo.'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.user) {
      setError(authErrorMessage(signInError?.message ?? ''))
      setLoading(false)
      return
    }

    // Lee el rol del profile para decidir la vista de destino.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = (profile?.role ?? null) as RolUsuario | null
    const redirect = searchParams.get('redirect')
    const destination = redirect && redirect.startsWith('/') ? redirect : homeForRole(role)

    // refresh() fuerza al middleware a revalidar con la sesión ya activa.
    router.replace(destination)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary-600">Despachr</h1>
        <p className="text-gray-600 mt-1">Gestión Logística Inteligente</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="correo@empresa.com"
          label="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Iniciar sesión
        </Button>
      </form>

      <p className="text-center text-xs text-gray-500">
        ¿No tienes acceso? Contacta al administrador de tu empresa.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
