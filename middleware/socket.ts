import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/socket')) {
    const response = NextResponse.next()
    
    // Imposta gli header CORS
    const origin = request.headers.get('origin') || '*'
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Vary', 'Origin')

    // Gestisci le richieste preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: response.headers
      })
    }

    // Gestisci l'upgrade WebSocket
    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      console.log('🔄 Richiesta upgrade WebSocket ricevuta')
      response.headers.set('Upgrade', 'websocket')
      response.headers.set('Connection', 'Upgrade')
      response.headers.set('Sec-WebSocket-Protocol', request.headers.get('Sec-WebSocket-Protocol') || '')
    }

    return response
  }

  return NextResponse.next()
} 