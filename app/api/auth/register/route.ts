import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import { registerSchema } from '@/types/auth'
import { createErrorResponse } from '@/types/api'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    
    const { 
      nome, 
      cognome, 
      email, 
      telefono,
      password
    } = validatedData

    // Validazione numero di telefono
    if (telefono) {
      try {
        if (!isValidPhoneNumber(telefono)) {
          return NextResponse.json(
            { error: 'Numero di telefono non valido' },
            { status: 400 }
          )
        }

        // Normalizza il numero di telefono in formato internazionale
        const phoneNumber = parsePhoneNumber(telefono)
        if (!phoneNumber) {
          return NextResponse.json(
            { error: 'Impossibile analizzare il numero di telefono' },
            { status: 400 }
          )
        }

        // Verifica che il numero sia possibile per il paese specificato
        if (!phoneNumber.isPossible()) {
          return NextResponse.json(
            { error: 'Numero di telefono non possibile per il paese specificato' },
            { status: 400 }
          )
        }

        // Usa il numero normalizzato
        const normalizedPhone = phoneNumber.format('E.164')

        // Verifica se il numero è già registrato
        const existingPhone = await db.query(
          'SELECT id FROM users WHERE telefono = $1',
          [normalizedPhone]
        )

        if (existingPhone.rows.length > 0) {
          return NextResponse.json(
            { error: 'Numero di telefono già registrato' },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Formato numero di telefono non valido' },
          { status: 400 }
        )
      }
    }

    // Verifica email esistente
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

    // Genera token e data di scadenza
    const verificationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Inizia transazione
    await db.query('BEGIN')

    try {
      // Inserisci utente con numero normalizzato
      const result = await db.query(
        `INSERT INTO users (
          nome, cognome, email, telefono, password,
          ruolo, attivo, verification_token, email_verified
        ) VALUES ($1, $2, $3, $4, $5, 'cliente', false, $6, false)
        RETURNING id`,
        [
          nome,
          cognome,
          email.toLowerCase(),
          telefono ? parsePhoneNumber(telefono).format('E.164') : null,
          await bcrypt.hash(password, 10),
          verificationToken
        ]
      )

      // Traccia tentativo di verifica
      await db.query(
        `INSERT INTO email_verifications (
          user_id, email, token, expires_at, 
          ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          result.rows[0].id,
          email.toLowerCase(),
          verificationToken,
          expiresAt,
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        ]
      )

      // Invia email di verifica
      await sendVerificationEmail(
        email,
        nome,
        verificationToken
      )

      await db.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Registrazione completata. Controlla la tua email per verificare l\'account.'
      })

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Errore nella registrazione:', error)
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    )
  }
} 