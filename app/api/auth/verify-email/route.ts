import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/types/api'

export async function POST(request: Request) {
  const dbClient = await db.connect()

  try {
    const { token } = await request.json() as { token: string }
    
    if (!token) {
      return NextResponse.json(
        createErrorResponse('Invalid verification link'),
        { status: 400 }
      )
    }

    // Inizia transazione
    await dbClient.query('BEGIN')

    try {
      // Verifica token valido e non scaduto
      const { rows } = await dbClient.query(`
        SELECT 
          ev.user_id,
          ev.status,
          ev.expires_at,
          u.email_verified
        FROM email_verifications ev
        JOIN users u ON u.id = ev.user_id
        WHERE ev.token = $1
      `, [token])

      if (rows.length === 0) {
        return NextResponse.json(
          createErrorResponse('Invalid verification link'),
          { status: 400 }
        )
      }

      const verification = rows[0]

      // Controlla se l'email è già stata verificata
      if (verification.email_verified) {
        return NextResponse.json(
          createErrorResponse('This email has already been verified'),
          { status: 400 }
        )
      }

      // Controlla se il token è scaduto
      if (new Date(verification.expires_at) < new Date()) {
        return NextResponse.json(
          createErrorResponse('This verification link has expired'),
          { status: 400 }
        )
      }

      // Aggiorna lo stato di verifica email dell'utente
      await dbClient.query(`
        UPDATE users 
        SET email_verified = true,
            email_verified_at = NOW()
        WHERE id = $1
      `, [verification.user_id])

      // Aggiorna lo stato della verifica
      await dbClient.query(`
        UPDATE email_verifications
        SET status = 'completed',
            verified_at = NOW()
        WHERE token = $1
      `, [token])

      await dbClient.query('COMMIT')

      return NextResponse.json(
        createSuccessResponse('Email verified successfully')
      )

    } catch (error) {
      await dbClient.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      createErrorResponse('An error occurred while verifying your email'),
      { status: 500 }
    )
  } finally {
    dbClient.release()
  }
} 