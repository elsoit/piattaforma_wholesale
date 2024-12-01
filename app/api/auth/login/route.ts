import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Dati ricevuti:', { 
      email: body.email,
      passwordLength: body.password?.length 
    })

    const { email, password } = body

    // Query al database
    const result = await db.query(
      'SELECT id, email, password, ruolo, attivo FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    const user = result.rows[0]
    
    if (!user) {
      console.log('Utente non trovato')
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Controllo se l'utente è attivo
    if (!user.attivo) {
      console.log('Utente non attivo')
      return NextResponse.json(
        { error: 'Account non attivo. Contattare l\'amministratore.' },
        { status: 403 }
      )
    }

    console.log('Password ricevuta:', password)
    console.log('Password nel DB:', user.password)

    try {
      const passwordMatch = await bcrypt.compare(password, user.password)
      console.log('Risultato confronto password:', passwordMatch)

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Password non corretta' },
          { status: 401 }
        )
      }
    } catch (bcryptError) {
      console.error('Errore bcrypt:', bcryptError)
      return NextResponse.json(
        { error: 'Errore nella verifica della password' },
        { status: 500 }
      )
    }

    // Login riuscito
    const sessionToken = crypto.randomUUID()
    
    const cookieStore = await cookies()
    await cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    await cookieStore.set('ruolo', user.ruolo || 'user', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ruolo: user.ruolo
      }
    })

  } catch (error) {
    console.error('Errore completo:', error)
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    )
  }
} 