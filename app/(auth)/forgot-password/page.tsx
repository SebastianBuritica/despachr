'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'
import { supabase } from '@/lib/supabase'

// Misma validación de formato que el login (el servidor sigue siendo la verdad).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailTrim = email.trim()
    const nextError = !emailTrim
      ? 'Ingresa tu correo.'
      : !EMAIL_RE.test(emailTrim)
        ? 'Ingresa un correo válido.'
        : null
    setEmailError(nextError)
    if (nextError) return

    setLoading(true)

    // DECISIÓN: no se distingue "correo existe" de "no existe" en la UI. Decirlo
    // convierte esta pantalla en un oráculo de enumeración de cuentas: cualquiera
    // podría averiguar quién trabaja aquí probando correos. Siempre confirmamos.
    await supabase.auth.resetPasswordForEmail(emailTrim, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    setSent(true)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full min-w-0 max-w-[360px] space-y-6">
        <BrandMark className="h-8 text-brand-ink" />

        {sent ? (
          <div className="space-y-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-brand/10">
              <MailCheck className="size-5 text-brand-ink" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Revisa tu correo</h1>
              <p className="text-sm text-muted-foreground">
                Si <span className="font-medium text-foreground">{email.trim()}</span> tiene una
                cuenta, le enviamos un enlace para crear una contraseña nueva. El enlace vence en
                una hora.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿No llegó? Revisa spam, o{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-medium text-brand-ink hover:underline"
              >
                inténtalo con otro correo
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
              <p className="text-sm text-muted-foreground">
                Te enviamos un enlace para crear una contraseña nueva.
              </p>
            </div>

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

              <Button type="submit" className="h-[42px] w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </Button>
            </form>
          </>
        )}

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
