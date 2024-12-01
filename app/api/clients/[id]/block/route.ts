import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id
  console.log('Tentativo di blocco del cliente:', clientId)

  const dbClient = await db.connect()
  
  try {
    // Verifica che il cliente esista
    const checkResult = await dbClient.query(
      'SELECT id, stato, user_id FROM clients WHERE id = $1',
      [clientId]
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Cliente non trovato'
      }, { status: 404 })
    }

    const { user_id } = checkResult.rows[0]

    // Blocca il cliente
    await dbClient.query(
      'UPDATE clients SET stato = $1 WHERE id = $2',
      ['inattivo', clientId]
    )

    // Blocca l'utente
    await dbClient.query(
      'UPDATE users SET attivo = false WHERE id = $1',
      [user_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Cliente bloccato con successo'
    })

  } catch (error) {
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