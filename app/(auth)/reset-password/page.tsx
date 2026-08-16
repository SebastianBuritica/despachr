'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'
import { supabase } from '@/lib/supabase'
import { homeForRole } from '@/lib/roles'
import type { RolUsuario } from '@/types'

// Supabase exige 6; pedimos 8 porque estas cuentas son admin/coordinadora.
const MIN_LENGTH = 8

type LinkStatus = 'checking' | 'ready' | 'invalid'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Supabase devuelve el enlace vencido/consumido como ?error=…&error_code=…
  // Se conoce en el primer render, así que es estado DERIVADO, no algo que un
  // efecto deba setear después.
  const urlError = searchParams.get('error') ?? searchParams.get('error_code')

  const [status, setStatus] = useState<LinkStatus>(urlError ? 'invalid' : 'checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // El enlace del correo llega como ?code=… y `detectSessionInUrl` lo canjea por
  // una sesión de recuperación de forma ASÍNCRONA — por eso no basta con leer
  // getSession() una vez al montar: puede correr antes del canje. Escuchamos el
  // cambio de estado y, si no llega nada, damos un margen antes de declarar el
  // enlace inválido.
  useEffect(() => {
    if (urlError) return

    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const settle = (next: LinkStatus) => {
      if (settled) return
      settled = true
      setStatus(next)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) settle('ready')
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return
      if (session) {
        settle('ready')
        return
      }
      timer = setTimeout(async () => {
        const { data } = await supabase.auth.getSession()
        settle(data.session ? 'ready' : 'invalid')
      }, 2000)
    })

    return () => {
      settled = true
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [urlError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const nextFieldError =
      password.length < MIN_LENGTH
        ? `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`
        : password !== confirm
          ? 'Las contraseñas no coinciden.'
          : null
    setFieldError(nextFieldError)
    if (nextFieldError) return

    setLoading(true)

    const { data, error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError || !data.user) {
      // El caso típico: la sesión de recuperación venció mientras llenaba el form.
      setError(
        updateError?.message?.toLowerCase().includes('session')
          ? 'El enlace venció. Pide uno nuevo.'
          : 'No fue posible actualizar la contraseña. Inténtalo de nuevo.'
      )
      setLoading(false)
      return
    }

    // Ya hay sesión válida: lo mandamos a su panel en vez de obligarlo a
    // iniciar sesión otra vez con la contraseña que acaba de crear.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.replace(homeForRole((profile?.role ?? null) as RolUsuario | null))
    router.refresh()
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Validando el enlace…
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Enlace inválido o vencido</h1>
          <p className="text-sm text-muted-foreground">
            Los enlaces de recuperación duran una hora y sirven una sola vez. Pide uno nuevo.
          </p>
        </div>
        <Button asChild className="h-[42px] w-full">
          <Link href="/forgot-password">Pedir un enlace nuevo</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nueva contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Debe tener al menos {MIN_LENGTH} caracteres.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña nueva</Label>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldError) setFieldError(null)
            }}
            aria-invalid={!!fieldError}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confírmala</Label>
          <Input
            id="confirm"
            type="password"
            name="confirm"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              if (fieldError) setFieldError(null)
            }}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'password-error' : undefined}
            required
          />
          {fieldError && (
            <p id="password-error" className="text-xs text-destructive">
              {fieldError}
            </p>
          )}
        </div>

        <Button type="submit" className="h-[42px] w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full min-w-0 max-w-[360px] space-y-6">
        <BrandMark className="h-8 text-brand dark:text-white" />
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  )
}
