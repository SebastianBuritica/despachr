import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MapPin, Users, Zap, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="font-bold text-gray-900">Despachr</span>
          </div>
          <Link href="/login">
            <Button>Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-100 to-secondary-100 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Gestión Logística Inteligente
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Digitaliza la operación de tu empresa de transporte. Deja atrás Excel y WhatsApp.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">
                Acceder
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Características Principales
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <MapPin className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ubicación en Tiempo Real</h3>
              <p className="text-gray-600">
                Sigue a tus conductores en tiempo real y recibe alertas automáticas
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <Users className="w-12 h-12 text-secondary-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gestión de Equipos</h3>
              <p className="text-gray-600">
                Administra conductores, rutas y clientes desde un solo panel
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <Zap className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Operación Eficiente</h3>
              <p className="text-gray-600">
                Reducción de costos operativos y mejora de la puntualidad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para modernizar tu operación?</h2>
          <p className="text-lg mb-8 opacity-90">
            Únete a decenas de empresas que ya confían en Despachr
          </p>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Comienza Ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2024 Despachr. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
