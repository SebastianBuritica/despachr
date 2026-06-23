import { type NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password']
const driverRoutes = ['/driver']
const dashboardRoutes = ['/dashboard']
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes - allow access
  if (publicRoutes.includes(pathname) || pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Protected routes - check for auth token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
