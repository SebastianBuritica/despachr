import type { RolUsuario } from '@/types'

// A dónde va cada rol tras autenticarse, o al pisar una ruta que no le toca.
// Vive aquí porque lo necesitan tres sitios con runtimes distintos —
// `middleware.ts` (Edge), el login y el reset de contraseña (cliente) — y tener
// tres copias es exactamente cómo se desincroniza el ruteo por rol.
//
// `admin` y `coordinador` van al MISMO panel (`/dashboard`, ver `informe/`
// adentro). `admin` no desbloquea ninguna pantalla propia — es sólo el rol que
// puede cambiar el `role` de otro perfil (protect_profile_columns, migración
// 007) y borrar del bucket `cumplidos`; eso se hace por SQL directo, no por la
// app, así que no necesita un panel aparte.
export function homeForRole(role: RolUsuario | null): string {
  if (role === 'conductor') return '/driver'
  return '/dashboard'
}
