import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/types/api'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await params.id

    // Inizia transazione
    await db.query('BEGIN')

    try {
      // Recupera info utente
      const userResult = await db.query(`
        SELECT nome, email, email_verified
        FROM users
        WHERE id = $1
      `, [userId])

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          createErrorResponse('Utente non trovato'),
          { status: 404 }
        )
      }

      const user = userResult.rows[0]

      if (user.email_verified) {
        return NextResponse.json(
          createErrorResponse('Email già verificata'),
          { status: 400 }
        )
      }

      // Genera nuovo token
      const verificationToken = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Aggiorna token utente
      await db.query(`
        UPDATE users 
        SET verification_token = $1
        WHERE id = $2
      `, [verificationToken, userId])

      // Inserisci nuovo tentativo
      await db.query(`
        INSERT INTO email_verifications (
          user_id, email, token, expires_at,
          ip_address, user_agent, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [
          userId,
          user.email,
          verificationToken,
          expiresAt,
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        ]
      )

      // Invia email
      await sendVerificationEmail(
        user.email,
        user.nome,
        verificationToken
      )

      await db.query('COMMIT')

      return NextResponse.json(
        createSuccessResponse('Email di verifica inviata con successo')
      )

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Errore nel reinvio della verifica:', error)
    return NextResponse.json(
      createErrorResponse('Errore nel reinvio della verifica'),
      { status: 500 }
    )
  }
} 