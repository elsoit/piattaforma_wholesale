import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as LoginRequest

    // Query modificata per includere il campo attivo
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
    const { rows: [user] } = await db.query(userQuery, [email.toLowerCase()])

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verifica password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verifica se l'utente è attivo
    if (!user.attivo) {
      return NextResponse.json(
        { error: 'Your account is not active yet. Please wait for activation.' },
        { status: 403 }
      )
    }

    // Per i clienti, verifica anche lo stato del client
    if (user.ruolo === 'cliente' && user.client_stato !== 'attivo') {
      return NextResponse.json(
        { error: 'Your business account is pending approval.' },
        { status: 403 }
      )
    }

    // Se arriviamo qui, l'utente è autenticato e attivo
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ruolo: user.ruolo
      },
      redirectUrl: user.ruolo === 'admin' ? '/dashboard' : '/vetrina'
    })

    // Imposta i cookie
    response.cookies.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    response.cookies.set('user_role', user.ruolo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    if (user.ruolo === 'cliente' && user.client_id) {
      response.cookies.set('client_id', user.client_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    }

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
} 