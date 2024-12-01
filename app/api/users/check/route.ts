import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const result = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      )
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('Errore nel controllo email:', error)
    return NextResponse.json(
      { error: 'Errore nel controllo email' },
      { status: 500 }
    )
  }
} 