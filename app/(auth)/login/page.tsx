'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandMark } from '@/components/brand/BrandMark'
import { supabase } from '@/lib/supabase'
import { homeForRole } from '@/lib/roles'
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '@/lib/phone'
import type { RolUsuario } from '@/types'

// Solo aceptamos rutas internas: evita open-redirect (incluye protocol-relative //host y /\host,
// que el navegador trata como absolutas).
function safeRedirect(target: string | null): string | null {
  if (!target) return null
  if (!target.startsWith('/')) return null
  if (target.startsWith('//') || target.startsWith('/\\')) return null
  return target
}

// Traduce los errores de Supabase Auth a mensajes claros en español.
function authErrorMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Tu correo aún no ha sido verificado.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  return 'No fue posible iniciar sesión. Inténtalo de nuevo.'
}

// Errores del flujo OTP. El primero es el importante: como mandamos
// `shouldCreateUser: false`, un número que no está dado de alta NO crea cuenta
// — Supabase responde "signups not allowed". Para el conductor eso no es un
// error técnico, es "todavía no te han dado de alta".
function otpErrorMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('signups not allowed') || m.includes('otp_disabled'))
    return 'Ese número no está registrado. Pídele a tu coordinador que te dé de alta.'
  if (m.includes('expired') || m.includes('invalid'))
    return 'El código es incorrecto o ya venció. Pide uno nuevo.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  return 'No fue posible enviarte el código. Inténtalo de nuevo.'
}

// Validación de formato básica en cliente (el servidor sigue siendo la fuente de verdad).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_SECONDS = 60

// Paso final compartido por ambos flujos: sin rol no sabemos a qué panel
// mandar, así que no dejamos la sesión en un estado ambiguo.
function useCompleteSignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return useCallback(
    async (userId: string): Promise<string | null> => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      const role = (profile?.role ?? null) as RolUsuario | null

      if (profileError || !role) {
        await supabase.auth.signOut()
        return 'Tu cuenta no tiene un perfil asignado. Contacta a tu administrador.'
      }

      const redirect = safeRedirect(searchParams.get('redirect'))
      // refresh() fuerza al middleware a revalidar con la sesión ya activa.
      router.replace(redirect ?? homeForRole(role))
      router.refresh()
      return null
    },
    [router, searchParams]
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

function EmailForm() {
  const completeSignIn = useCompleteSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validación en cliente antes de tocar la red.
    const emailTrim = email.trim()
    const nextEmailError = !emailTrim
      ? 'Ingresa tu correo.'
      : !EMAIL_RE.test(emailTrim)
        ? 'Ingresa un correo válido.'
        : null
    const nextPasswordError = !password ? 'Ingresa tu contraseña.' : null
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    if (nextEmailError || nextPasswordError) return

    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailTrim,
      password,
    })

    if (signInError || !data.user) {
      setError(authErrorMessage(signInError?.message ?? ''))
      setLoading(false)
      return
    }

    const completionError = await completeSignIn(data.user.id)
    if (completionError) {
      setError(completionError)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

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
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError(null)
            }}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            required
          />
          {emailError && (
            <p id="email-error" className="text-xs text-destructive">
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError(null)
            }}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
            required
          />
          {passwordError && (
            <p id="password-error" className="text-xs text-destructive">
              {passwordError}
            </p>
          )}
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
    </div>
  )
}

function PhoneForm() {
  const completeSignIn = useCompleteSignIn()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Cuenta regresiva del reenvío. El SMS cuesta dinero (Twilio) y Supabase
  // aplica su propio rate limit: mejor un botón que dice cuánto falta que uno
  // que deja pedir otro código y falla.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendCode = async (target: string) => {
    setError(null)
    setLoading(true)

    // shouldCreateUser: false → el login NUNCA crea cuentas. Los conductores los
    // da de alta el admin; el registro público está deshabilitado a propósito
    // (ver AGENTS.md) y esta bandera es la otra mitad de esa decisión.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: target,
      options: { shouldCreateUser: false },
    })

    setLoading(false)

    if (otpError) {
      setError(otpErrorMessage(otpError.message))
      return false
    }

    setSentTo(target)
    setStep('code')
    setCode('')
    setCooldown(RESEND_SECONDS)
    return true
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalized = normalizePhone(phone)
    if (!isValidPhone(normalized)) {
      setFieldError('Escribe tu número de celular a 10 dígitos.')
      return
    }
    setFieldError(null)
    await sendCode(normalized)
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = code.trim()
    if (token.length !== 6) {
      setFieldError('El código son 6 dígitos.')
      return
    }
    setFieldError(null)
    setError(null)
    setLoading(true)

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: sentTo,
      token,
      type: 'sms',
    })

    if (verifyError || !data.user) {
      setError(otpErrorMessage(verifyError?.message ?? ''))
      setLoading(false)
      return
    }

    const completionError = await completeSignIn(data.user.id)
    if (completionError) {
      setError(completionError)
      setLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <p className="text-sm text-muted-foreground">
          Enviamos un código a{' '}
          <span className="font-medium text-foreground">{formatPhoneDisplay(sentTo)}</span>.
        </p>

        <form className="space-y-4" onSubmit={handleCodeSubmit}>
          <div className="space-y-2">
            <Label htmlFor="code">Código de 6 dígitos</Label>
            <Input
              id="code"
              name="code"
              // one-time-code deja que iOS/Android ofrezcan el código del SMS
              // sin salir de la app — para un conductor con guantes, en la
              // calle, esa diferencia es el flujo entero.
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoFocus
              className="text-center font-mono text-lg tracking-[0.4em]"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''))
                if (fieldError) setFieldError(null)
              }}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'code-error' : undefined}
              required
            />
            {fieldError && (
              <p id="code-error" className="text-xs text-destructive">
                {fieldError}
              </p>
            )}
          </div>

          <Button type="submit" className="h-[42px] w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Verificando…' : 'Entrar'}
          </Button>
        </form>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStep('phone')
              setError(null)
              setFieldError(null)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Cambiar número
          </button>

          <button
            type="button"
            disabled={cooldown > 0 || loading}
            onClick={() => sendCode(sentTo)}
            className="text-xs font-medium text-brand hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <form className="space-y-4" onSubmit={handlePhoneSubmit}>
        <div className="space-y-2">
          <Label htmlFor="phone">Número de celular</Label>
          <div className="flex items-center gap-2">
            <span className="flex h-9 shrink-0 items-center rounded-md border border-input bg-muted px-3 font-mono text-sm text-muted-foreground">
              +57
            </span>
            <Input
              id="phone"
              type="tel"
              name="phone"
              autoComplete="tel-national"
              inputMode="numeric"
              placeholder="320 123 4567"
              className="flex-1 font-mono"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (fieldError) setFieldError(null)
              }}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'phone-error' : undefined}
              required
            />
          </div>
          {fieldError && (
            <p id="phone-error" className="text-xs text-destructive">
              {fieldError}
            </p>
          )}
        </div>

        <Button type="submit" className="h-[42px] w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Enviando código…' : 'Enviarme un código'}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Te llega un SMS con un código de 6 dígitos. No necesitas contraseña.
      </p>
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const middlewareError =
    searchParams.get('error') === 'perfil'
      ? 'Tu cuenta no tiene un perfil asignado. Contacta a tu administrador.'
      : null

  return (
    <div className="w-full min-w-0 max-w-[360px] space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">Ingresa a tu panel de operación.</p>
      </div>

      {middlewareError && <ErrorBanner message={middlewareError} />}

      {/* Teléfono primero: los conductores son la mayoría de los inicios de
          sesión diarios, y son quienes entran desde la calle. */}
      <Tabs defaultValue="phone">
        <TabsList className="w-full">
          <TabsTrigger value="phone" className="flex-1">
            Teléfono
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            Correo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phone">
          <PhoneForm />
        </TabsContent>

        <TabsContent value="email">
          <EmailForm />
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        ¿Sin cuenta? Habla con tu administrador.
      </p>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-panel p-14 text-panel-foreground lg:flex">
      {/* Glow radial decorativo */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/30 blur-3xl" />

      <div className="relative flex items-center gap-2.5">
        <BrandMark className="h-8 text-white" />
        <span className="text-lg font-semibold tracking-tight">Despachr</span>
      </div>

      <div className="relative space-y-6">
        <h2 className="max-w-md text-[36px] font-bold leading-tight tracking-tight">
          Toda tu operación de carga, en tiempo real.
        </h2>
        <p className="max-w-sm text-panel-muted">
          Conductores, rutas y cumplimiento sincronizados — desde el primer despacho hasta la
          última entrega.
        </p>
        <div className="flex items-center gap-8 pt-2">
          <div>
            <p className="font-mono text-3xl font-semibold text-brand-light">94.8%</p>
            <p className="mt-1 text-sm text-panel-muted">Cumplimiento</p>
          </div>
          <div className="h-10 w-px bg-white/15" />
          <div>
            <p className="font-mono text-3xl font-semibold">
              48.3 <span className="text-2xl">T</span>
            </p>
            <p className="mt-1 text-sm text-panel-muted">Movilizadas / sem</p>
          </div>
        </div>
      </div>

      <p className="relative text-xs text-panel-muted">© 2026 Despachr · Transporte de carga</p>
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
