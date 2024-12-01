import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get('session')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const result = await db.query(
      `SELECT id, nome, cognome, email, telefono, ruolo, attivo, 
      created_at, updated_at 
      FROM users 
      WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get('session')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nome, cognome, telefono } = body

    const result = await db.query(
      `UPDATE users 
       SET nome = $1, 
           cognome = $2, 
           telefono = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, nome, cognome, email, telefono, ruolo, attivo, created_at, updated_at`,
      [nome, cognome, telefono, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 