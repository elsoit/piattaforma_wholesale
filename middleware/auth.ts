import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from '@/types/auth'

interface AuthState {
  session?: string
  role?: UserRole
  clientId?: string
}

// Helper per estrarre lo stato di autenticazione dai cookie
function getAuthState(request: NextRequest): AuthState {
  return {
    session: request.cookies.get('session')?.value,
    role: request.cookies.get('user_role')?.value as UserRole | undefined,
    clientId: request.cookies.get('client_id')?.value
  }
}

// Helper per verificare se l'utente può accedere a un percorso
function canAccess(path: string, role?: UserRole): boolean {
  // Percorsi pubblici
  const publicPaths = ['/login', '/register', '/forgot-password']
  if (publicPaths.includes(path)) return true

  // Se non c'è ruolo, accesso negato
  if (!role) return false

  // Regole per admin
  if (role === 'admin') {
    return path.startsWith('/dashboard')
  }

  // Regole per cliente
  if (role === 'cliente') {
    return path.startsWith('/vetrina')
  }

  // Regole per user
  if (role === 'user') {
    return path.startsWith('/vetrina') && !path.includes('/brands')
  }

  return false
}

// Helper per ottenere l'URL di reindirizzamento in base al ruolo
function getRedirectUrl(role?: UserRole): string {
  if (role === 'admin') return '/dashboard'
  if (role === 'cliente' || role === 'user') return '/vetrina'
  return '/login'
}

export async function middleware(request: NextRequest) {
  const { session, role, clientId } = getAuthState(request)
  const path = request.nextUrl.pathname

  // Log per debug
  console.log('Auth Middleware:', { path, session, role, clientId })

  // Gestione percorsi pubblici
  if (path === '/login' || path === '/register') {
    if (session && role) {
      return NextResponse.redirect(new URL(getRedirectUrl(role), request.url))
    }
    return NextResponse.next()
  }

  // Se non c'è sessione, reindirizza al login
  if (!session || !role) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', path)
    return NextResponse.redirect(loginUrl)
  }

  // Verifica accesso al percorso
  if (!canAccess(path, role)) {
    return NextResponse.redirect(new URL(getRedirectUrl(role), request.url))
  }

  // Aggiungi headers per il ruolo e clientId se presente
  const response = NextResponse.next()
  response.headers.set('x-user-role', role)
  if (clientId) {
    response.headers.set('x-client-id', clientId)
  }

  return response
}

// Configura i percorsi da proteggere
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 