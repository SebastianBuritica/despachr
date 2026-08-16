import type { RolUsuario } from '@/types'

// A dónde va cada rol tras autenticarse, o al pisar una ruta que no le toca.
// Vive aquí porque lo necesitan tres sitios con runtimes distintos —
// `middleware.ts` (Edge), el login y el reset de contraseña (cliente) — y tener
// tres copias es exactamente cómo se desincroniza el ruteo por rol.
export function homeForRole(role: RolUsuario | null): string {
  if (role === 'conductor') return '/driver'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}
