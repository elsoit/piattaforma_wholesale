import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id
  console.log('Tentativo di eliminazione soft del cliente:', clientId)
  
  const dbClient = await db.connect()
  
  try {
    // Inizia la transazione
    await dbClient.query('BEGIN')

    // Verifica che il cliente esista e ottieni più informazioni
    const { rows } = await dbClient.query(
      'SELECT user_id, company_name, stato FROM clients WHERE id = $1',
      [clientId]
    )

    if (rows.length === 0) {
      await dbClient.query('ROLLBACK')
      return NextResponse.json({
        success: false,
        message: 'Cliente non trovato'
      }, { status: 404 })
    }

    const { user_id, company_name, stato } = rows[0]

    // Verifica se il cliente è già eliminato
    if (stato === 'eliminata') {
      await dbClient.query('ROLLBACK')
      return NextResponse.json({
        success: false,
        message: 'Cliente già eliminato'
      }, { status: 400 })
    }

    // Imposta lo stato del cliente a "eliminata"
    await dbClient.query(
      'UPDATE clients SET stato = $1 WHERE id = $2',
      ['eliminata', clientId]
    )

    // Disattiva l'utente associato
    await dbClient.query(
      'UPDATE users SET attivo = false WHERE id = $1',
      [user_id]
    )

    await dbClient.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: `Cliente ${company_name} eliminato con successo`
    })

  } catch (error) {
    await dbClient.query('ROLLBACK')
    console.error('Errore durante l\'eliminazione:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore durante l\'eliminazione del cliente'
    }, { status: 500 })
  } finally {
    dbClient.release()
  }
} 