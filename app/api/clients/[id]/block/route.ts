import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface BlockRequestBody {
  blockOnlyClient: boolean
  updatedStatus: string
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id
  console.log('Tentativo di blocco del cliente:', clientId)

  // Leggi il body della richiesta con type assertion
  const body = await request.json() as BlockRequestBody
  const blockOnlyClient = body.blockOnlyClient === true

  const dbClient = await db.connect()
  
  try {
    // Inizia la transazione
    await dbClient.query('BEGIN')

    // Verifica che il cliente esista
    const checkResult = await dbClient.query(
      'SELECT id, stato, user_id FROM clients WHERE id = $1',
      [clientId]
    )

    if (checkResult.rows.length === 0) {
      await dbClient.query('ROLLBACK')
      return NextResponse.json({
        success: false,
        message: 'Cliente non trovato'
      }, { status: 404 })
    }

    const { user_id } = checkResult.rows[0]

    // Blocca il cliente
    await dbClient.query(
      'UPDATE clients SET stato = $1 WHERE id = $2',
      [body.updatedStatus, clientId]
    )

    // Blocca l'utente SOLO se blockOnlyClient è false
    if (!blockOnlyClient) {
      await dbClient.query(
        'UPDATE users SET attivo = false WHERE id = $1',
        [user_id]
      )
    }

    await dbClient.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Cliente bloccato con successo'
    })

  } catch (error) {
    await dbClient.query('ROLLBACK')
    console.error('Errore dettagliato:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore durante il blocco del cliente',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 })
  } finally {
    dbClient.release()
  }
} 