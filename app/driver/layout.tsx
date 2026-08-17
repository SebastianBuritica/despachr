import { ServiceWorkerRegistration } from '@/components/driver/ServiceWorkerRegistration'

// App del conductor: mobile-first, columna centrada en pantallas grandes.
// El service worker se registra AQUÍ y no en el layout raíz: es el único rol
// que trabaja sin señal (ver el componente).
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-md bg-background">
      <ServiceWorkerRegistration />
      {children}
    </div>
  )
}
