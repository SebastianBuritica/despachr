import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { RolUsuario } from '@/types'

// Protegemos /dashboard/* (coordinador), /admin/* (admin) y /driver/* (conductor);
// el resto (/, /login) es público.
// A dónde va cada rol tras autenticarse o al pisar una ruta que no le toca.
function homeForRole(role: RolUsuario | null): string {
  if (role === 'conductor') return '/driver'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}

export async function middleware(request: NextRequest) {
  // Respuesta base: el cliente de Supabase puede refrescar tokens y reescribir cookies aquí.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? null) as RolUsuario | null
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
