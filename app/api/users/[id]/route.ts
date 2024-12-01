import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Recupera un singolo utente
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params
  const id = params.id
  
  try {
    const result = await db.query(
      `SELECT id, nome, cognome, email, telefono, ruolo, attivo,
      created_at, updated_at 
      FROM users WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Errore nel recupero dell\'utente:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'utente' },
      { status: 500 }
    )
  }
}

// PUT: Aggiorna un utente
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params
  const id = params.id
  
  try {
    const body = await request.json()
    const { nome, cognome, email, telefono, ruolo, attivo } = body

    // Verifica se l'email è già utilizzata da un altro utente
    if (email) {
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      )

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email già in uso da un altro utente' },
          { status: 400 }
        )
      }
    }

    const result = await db.query(
      `UPDATE users 
      SET nome = $1, 
          cognome = $2, 
          email = $3,
          telefono = $4, 
          ruolo = $5, 
          attivo = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, nome, cognome, email, telefono, ruolo, attivo, created_at, updated_at`,
      [
        nome,
        cognome,
        email.toLowerCase(),
        telefono,
        ruolo,
        attivo,
        id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'utente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'utente' },
      { status: 500 }
    )
  }
}

// DELETE: Elimina un utente
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params
  const id = params.id
  
  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Utente eliminato con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'utente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'utente' },
      { status: 500 }
    )
  }
} 