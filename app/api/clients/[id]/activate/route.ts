import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { firstActivationTemplate } from '@/lib/email-templates/first-activation'

interface ActivateRequest {
  isFirstActivation: boolean
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = await params.id
  const { isFirstActivation } = await request.json() as ActivateRequest
  const dbClient = await db.connect()
  
  try {
    await dbClient.query('BEGIN')

    // Recupera i dati del cliente e dell'utente
    const { rows: [client] } = await dbClient.query(`
      SELECT 
        c.*,
        u.nome,
        u.email as user_email,
        u.id as user_id,
        c.company_name
      FROM clients c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [clientId])

    if (!client) {
      throw new Error('Cliente non trovato')
    }

    // Attiva il cliente
    await dbClient.query(
      'UPDATE clients SET stato = $1 WHERE id = $2',
      ['attivo', clientId]
    )

    // Se è la prima attivazione, attiva anche l'utente e invia l'email
    if (isFirstActivation) {
      await dbClient.query(
        'UPDATE users SET attivo = true WHERE id = $1',
        [client.user_id]
      )

      console.log('📧 [ACTIVATION] Tentativo di invio email di attivazione:', {
        userId: client.user_id,
        userEmail: client.user_email,
        companyName: client.company_name
      })

      try {
        // Invia l'email di prima attivazione all'email dell'utente
        await sendEmail({
          to: client.user_email,
          subject: 'Account Attivato con Successo',
          template: 'first-activation',
          data: {
            nome: client.nome,
            company_name: client.company_name,
            email: client.user_email
          }
        })

        console.log('✅ [ACTIVATION] Email di attivazione inviata con successo')

      } catch (emailError) {
        console.error('❌ [ACTIVATION] Errore nell\'invio dell\'email di attivazione:', {
          error: emailError instanceof Error ? emailError.message : 'Errore sconosciuto',
          userId: client.user_id,
          userEmail: client.user_email
        })
      }
    }

    await dbClient.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Cliente attivato con successo'
    })

  } catch (error) {
    await dbClient.query('ROLLBACK')
    console.error('Errore dettagliato:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore durante l\'attivazione del cliente',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 })
  } finally {
    dbClient.release()
  }
} 