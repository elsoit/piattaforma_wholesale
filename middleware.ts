import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'admin' | 'cliente' | 'user'

function parseRole(role: string | undefined): UserRole | null {
  if (!role) return null
  const normalizedRole = role.trim().toLowerCase()
  
  switch (normalizedRole) {
    case 'admin':
      return 'admin'
    case 'cliente':
      return 'cliente'
    case 'user':
      return 'user'
    default:
      return null
  }
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const rawRole = request.cookies.get('user_role')?.value
  const userRole = parseRole(rawRole)
  const path = request.nextUrl.pathname

  console.log('Middleware Check:', {
    session,
    rawRole,
    parsedRole: userRole,
    path,
  })

  // Permetti sempre l'accesso al login
  if (path === '/login') {
    if (session && userRole) {
      return NextResponse.redirect(new URL(userRole === 'admin' ? '/dashboard' : '/vetrina', request.url))
    }
    return NextResponse.next()
  }

  // Se non c'è sessione o ruolo valido, reindirizza al login
  if (!session || !userRole) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Reindirizza dalla root alla home appropriata
  if (path === '/') {
    return NextResponse.redirect(new URL(userRole === 'admin' ? '/dashboard' : '/vetrina', request.url))
  }

  // Gestione accessi in base al ruolo
  if (userRole === 'admin') {
    // Admin deve stare in dashboard
    if (!path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Non-admin non possono accedere alla dashboard
  if (path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/vetrina', request.url))
  }

  // User non può accedere a brands
  if (userRole === 'user' && path.startsWith('/vetrina/brands')) {
    return NextResponse.redirect(new URL('/vetrina', request.url))
  }

  // Per tutti gli altri casi, permetti l'accesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/vetrina/:path*'
  ]
} 