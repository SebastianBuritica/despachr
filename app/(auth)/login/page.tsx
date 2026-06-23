import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Despachr</h1>
        <p className="text-gray-600 mt-1">Gestión Logística Inteligente</p>
      </div>

      <form className="space-y-4">
        <Input type="email" placeholder="correo@empresa.com" label="Correo" required />
        <Input type="password" placeholder="Contraseña" label="Contraseña" required />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-600">Recuérdame</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" className="w-full">
          Inicia Sesión
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}
