import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      nome, 
      cognome, 
      email, 
      telefono,
      password,
      ruolo = 'cliente', 
      attivo = false 
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
      ) VALUES ($1, $2, $3, $4, $5, 'cliente', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, nome, cognome, email, telefono, ruolo, attivo`,
      [
        nome,
        cognome,
        email.toLowerCase(),
        telefono,
        hashedPassword,
        false
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