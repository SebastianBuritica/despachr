'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { RolUsuario } from '@/types'

function homeForRole(role: RolUsuario | null): string {
  if (role === 'conductor') return '/driver'
  if (role === 'admin') return '/admin'
  return '/dashboard'
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
    <div className="w-full min-w-0 max-w-[360px] space-y-6">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <a href="#" className="text-xs font-medium text-brand hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
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

        <Button type="submit" className="h-[42px] w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        <span>o</span>
        <Separator className="flex-1" />
      </div>

      <Button type="button" variant="outline" className="h-[42px] w-full" disabled>
        Entrar con SSO corporativo
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ¿Sin cuenta? Habla con tu administrador.
      </p>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-14 text-white lg:flex">
      {/* Glow radial decorativo */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/30 blur-3xl" />

      <div className="relative flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
          <Truck className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Despachr</span>
      </div>

      <div className="relative space-y-6">
        <h2 className="max-w-md text-[36px] font-bold leading-tight tracking-tight">
          Toda tu operación de carga, en tiempo real.
        </h2>
        <p className="max-w-sm text-slate-400">
          Conductores, rutas y cumplimiento sincronizados — desde el primer despacho hasta la
          última entrega.
        </p>
        <div className="flex items-center gap-8 pt-2">
          <div>
            <p className="font-mono text-3xl font-semibold text-brand-light">94.8%</p>
            <p className="mt-1 text-sm text-slate-400">Cumplimiento</p>
          </div>
          <div className="h-10 w-px bg-white/15" />
          <div>
            <p className="font-mono text-3xl font-semibold">
              48.3 <span className="text-2xl">T</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Movilizadas / sem</p>
          </div>
        </div>
      </div>

      <p className="relative text-xs text-slate-500">© 2026 Despachr · Transporte de carga</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
