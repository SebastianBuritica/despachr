'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
    <div className="w-full max-w-[360px] space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">Ingresa a tu panel de operación.</p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Correo corporativo</Label>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        ¿Sin cuenta? Habla con tu administrador.
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
