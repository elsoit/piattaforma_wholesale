import { NextResponse } from 'next/server'
import { createSuccessResponse } from '@/types/api'

export async function POST() {
  const response = NextResponse.json(createSuccessResponse({ loggedOut: true }))

  // Rimuovi tutti i cookie
  const cookieOptions = {
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const
  }

  response.cookies.set('session', '', cookieOptions)
  response.cookies.set('user_role', '', cookieOptions)
  response.cookies.set('client_id', '', cookieOptions)

  return response
} 