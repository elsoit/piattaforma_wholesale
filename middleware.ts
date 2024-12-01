import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Definisci le rotte pubbliche che non richiedono autenticazione
const publicRoutes = ['/login', '/register', '/forgot-password', '/registration-success']

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')
  const { pathname } = request.nextUrl

  // Permetti sempre l'accesso alle API
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Se l'utente è già loggato e prova ad accedere a rotte di auth, reindirizza alla dashboard
  if (sessionToken && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Se l'utente non è loggato e prova ad accedere a rotte protette
  if (!sessionToken && !publicRoutes.includes(pathname) && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configura su quali path il middleware deve essere eseguito
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 