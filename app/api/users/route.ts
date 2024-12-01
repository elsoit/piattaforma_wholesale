import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Recupera tutti gli utenti
export async function GET() {
  try {
    const result = await db.query(
      `SELECT id, nome, cognome, email, telefono, ruolo, attivo, 
      created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC`
    )
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli utenti' },
      { status: 500 }
    )
  }
}

// POST: Crea un nuovo utente
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      nome, 
      cognome, 
      email, 
      telefono,
      password,
      ruolo = 'user', 
      attivo = true 
    } = body

    // Verifica se l'utente esiste già
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      )
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Inserimento nuovo utente
    const result = await db.query(
      `INSERT INTO users (
        nome, 
        cognome, 
        email, 
        telefono,
        password, 
        ruolo, 
        attivo,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, nome, cognome, email, telefono, ruolo, attivo, created_at, updated_at`,
      [
        nome,
        cognome,
        email.toLowerCase(),
        telefono,
        hashedPassword,
        ruolo,
        attivo
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione dell\'utente:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'utente' },
      { status: 500 }
    )
  }
} 