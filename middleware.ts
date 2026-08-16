import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { homeForRole } from '@/lib/roles'
import type { RolUsuario } from '@/types'

// Protegemos /dashboard/* (coordinador), /admin/* (admin) y /driver/* (conductor);
// el resto (/, /login, /forgot-password, /reset-password) es público.

export async function middleware(request: NextRequest) {
  // Respuesta base: el cliente de Supabase puede refrescar tokens y reescribir cookies aquí.
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // DECISIÓN: sin config, FALLAR CERRADO. Con `!` (lo anterior) el cliente se
  // creaba apuntando a undefined, getUser() devolvía null y el middleware
  // interpretaba "no hay sesión" → todo el mundo al login, en bucle. Peor aún
  // sería el fallo abierto. Aquí se distingue: las rutas protegidas se cortan
  // con un 503 explícito y el resto del sitio (landing) sigue en pie.
  // `lib/supabase.ts` hace lo equivalente para el cliente del navegador.
  if (!supabaseUrl || !supabaseAnonKey) {
    const { pathname } = request.nextUrl
    const isProtected =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/driver')
    if (isProtected) {
      console.error(
        'Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY: ' +
          'no se puede verificar la sesión. Configúralas en Vercel (Production, ' +
          'Preview y Development).'
      )
      return new NextResponse('Configuración del servidor incompleta.', { status: 503 })
    }
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() valida el token contra Supabase (no confía en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')
  const isDriverRoute = pathname.startsWith('/driver')
  const isLogin = pathname === '/login'

  // --- Sin sesión -----------------------------------------------------------
  if (!user) {
    if (isDashboardRoute || isAdminRoute || isDriverRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // --- Con sesión: leer rol del profile ------------------------------------
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? null) as RolUsuario | null

  // Sesión válida pero sin perfil/rol: estado roto. No adivinamos panel (evita mandar
  // a un rol al panel equivocado y el bucle de redirección hacia homeForRole(null)).
  if (profileError || !role) {
    if (isDashboardRoute || isAdminRoute || isDriverRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'perfil')
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  const home = homeForRole(role)

  // Usuario autenticado intentando entrar a /login → a su vista.
  if (isLogin) {
    return NextResponse.redirect(new URL(home, request.url))
  }

  // /dashboard/* solo coordinador.
  if (isDashboardRoute && role !== 'coordinador') {
    return NextResponse.redirect(new URL(home, request.url))
  }

  // /admin/* solo admin.
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL(home, request.url))
  }

  // /driver/* solo conductor.
  if (isDriverRoute && role !== 'conductor') {
    return NextResponse.redirect(new URL(home, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
