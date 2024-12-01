import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id
  console.log('Tentativo di attivazione cliente:', clientId)
  
  const dbClient = await db.connect()
  
  try {
    await dbClient.query('BEGIN')

    const { rows } = await dbClient.query(
      'SELECT stato, user_id, company_name FROM clients WHERE id = $1',
      [clientId]
    )

    if (rows.length === 0) {
      await dbClient.query('ROLLBACK')
      return NextResponse.json({
        success: false,
        message: 'Cliente non trovato'
      }, { status: 404 })
    }

    const { stato, user_id, company_name } = rows[0]
    console.log('Stato attuale cliente:', stato)
    
    // Attiva l'utente se il cliente era in attesa o eliminato
    if (stato === 'in_attesa_di_attivazione' || stato === 'eliminata') {
      await dbClient.query(
        'UPDATE users SET attivo = true WHERE id = $1',
        [user_id]
      )
    }

    // Attiva il cliente
    await dbClient.query(
      'UPDATE clients SET stato = $1 WHERE id = $2',
      ['attivo', clientId]
    )

    await dbClient.query('COMMIT')

    let message = ''
    switch(stato) {
      case 'in_attesa_di_attivazione':
        message = `Cliente ${company_name} abilitato con successo`
        break
      case 'eliminata':
        message = `Cliente ${company_name} riattivato con successo`
        break
      default:
        message = `Cliente ${company_name} attivato con successo`
    }

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    await dbClient.query('ROLLBACK')
    console.error('Errore durante l\'attivazione:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore durante l\'attivazione del cliente'
    }, { status: 500 })
  } finally {
    dbClient.release()
  }
} 