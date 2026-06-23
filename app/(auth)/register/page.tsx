import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Despachr</h1>
        <p className="text-gray-600 mt-1">Crea tu cuenta</p>
      </div>

      <form className="space-y-4">
        <Input type="text" placeholder="Tu nombre" label="Nombre" required />
        <Input type="email" placeholder="correo@empresa.com" label="Correo" required />
        <Input type="tel" placeholder="+57 300 000 0000" label="Teléfono" required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600">
            <option>Selecciona...</option>
            <option>Administrador</option>
            <option>Coordinador</option>
            <option>Conductor</option>
          </select>
        </div>

        <Input type="password" placeholder="Contraseña" label="Contraseña" required />
        <Input type="password" placeholder="Confirma tu contraseña" label="Confirmar Contraseña" required />

        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" required />
          <span className="text-sm text-gray-600">
            Acepto los{' '}
            <Link href="#" className="text-primary-600 hover:underline">
              términos y condiciones
            </Link>
          </span>
        </label>

        <Button type="submit" className="w-full">
          Crear Cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
