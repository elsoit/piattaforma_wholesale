import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import { loginSchema } from '@/types/auth'
import { createErrorResponse, createSuccessResponse } from '@/types/api'

interface UserRow {
  id: number
  email: string
  password: string
  ruolo: string
  attivo: boolean
  client_id: number | null
  client_stato: string | null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.password,
        u.ruolo,
        u.attivo,
        CASE 
          WHEN u.ruolo = 'cliente' THEN c.id 
          ELSE NULL 
        END as client_id,
        CASE 
          WHEN u.ruolo = 'cliente' THEN c.stato 
          ELSE NULL 
        END as client_stato
      FROM users u
      LEFT JOIN clients c ON u.id = c.user_id
      WHERE u.email = $1
    `
    const { rows: [user] } = await db.query<UserRow>(userQuery, [validatedData.email.toLowerCase()])

    if (!user) {
      return NextResponse.json(
        createErrorResponse('Credenziali non valide'),
        { status: 401 }
      )
    }

    const validPassword = await bcrypt.compare(validatedData.password, user.password)
    if (!validPassword) {
      return NextResponse.json(
        createErrorResponse('Credenziali non valide'),
        { status: 401 }
      )
    }

    if (!user.attivo) {
      return NextResponse.json(
        createErrorResponse('Account non ancora attivo'),
        { status: 403 }
      )
    }

    if (user.ruolo === 'cliente' && user.client_stato !== 'attivo') {
      return NextResponse.json(
        createErrorResponse('Account business in attesa di approvazione'),
        { status: 403 }
      )
    }

    const redirectUrl = user.ruolo === 'admin' 
      ? '/dashboard'
      : user.ruolo === 'cliente' 
        ? '/vetrina'
        : '/vetrina' // default per altri ruoli

    const response = NextResponse.json(createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        ruolo: user.ruolo,
        clientId: user.client_id
      },
      redirectUrl
    }))

    // Imposta i cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 // 24 ore
    }

    response.cookies.set('session', user.id.toString(), cookieOptions)
    response.cookies.set('user_role', user.ruolo, cookieOptions)
    
    if (user.client_id) {
      response.cookies.set('client_id', user.client_id.toString(), cookieOptions)
    }

    return response

  } catch (error) {
    console.error('Errore login:', error)
    return NextResponse.json(
      createErrorResponse('Errore durante il login'),
      { status: 500 }
    )
  }
} 