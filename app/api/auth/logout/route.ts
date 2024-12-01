import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Rimuovi tutti i cookie rilevanti
  response.cookies.delete('session')
  response.cookies.delete('user_role')
  response.cookies.delete('client_id')

  // Imposta i cookie come scaduti
  response.cookies.set('session', '', {
    expires: new Date(0),
    path: '/'
  })
  response.cookies.set('user_role', '', {
    expires: new Date(0),
    path: '/'
  })
  response.cookies.set('client_id', '', {
    expires: new Date(0),
    path: '/'
  })

  console.log('Logout - Cookies rimossi')
  return response
} 