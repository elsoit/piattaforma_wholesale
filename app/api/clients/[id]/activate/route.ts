import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/types/api'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Inizia transazione
    await db.query('BEGIN')

    try {
      // Verifica che l'email sia verificata
      const result = await db.query(`
        SELECT u.email_verified
        FROM clients c
        JOIN users u ON u.id = c.user_id
        WHERE c.id = $1
      `, [clientId])

      if (result.rows.length === 0) {
        return NextResponse.json(
          createErrorResponse('Cliente non trovato'),
          { status: 404 }
        )
      }

      const { email_verified } = result.rows[0]

      if (!email_verified) {
        return NextResponse.json(
          createErrorResponse('Non è possibile attivare il cliente: email non verificata'),
          { status: 400 }
        )
      }

      // Procedi con l'attivazione
      await db.query(`
        UPDATE clients 
        SET stato = 'attivo',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [clientId])

      // Attiva anche l'utente associato
      await db.query(`
        UPDATE users u
        SET attivo = true
        FROM clients c
        WHERE c.user_id = u.id
        AND c.id = $1
      `, [clientId])

      await db.query('COMMIT')

      return NextResponse.json(
        createSuccessResponse('Cliente attivato con successo')
      )

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Errore nell\'attivazione del cliente:', error)
    return NextResponse.json(
      createErrorResponse('Errore durante l\'attivazione del cliente'),
      { status: 500 }
    )
  }
} 