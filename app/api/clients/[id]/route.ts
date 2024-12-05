import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  console.log('=== INIZIO API ===')
  
  try {
    const id = context.params.id
    console.log('ID:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID cliente mancante' },
        { status: 400 }
      )
    }

    const data = await request.json()
    console.log('Dati ricevuti:', data)

    // Validazione per aziende italiane
    if (data.country === 'IT' && !data.pec && !data.sdi) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Per le aziende italiane è necessario specificare almeno PEC o codice SDI' 
        },
        { status: 400 }
      )
    }

    // Verifica se la partita IVA è già utilizzata da un altro cliente
    const existingVat = await db.query(
      'SELECT id FROM clients WHERE vat_number = $1 AND id != $2',
      [data.vat_number.toUpperCase(), id]
    )

    if (existingVat.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Partita IVA già registrata' },
        { status: 400 }
      )
    }

    // Aggiornamento cliente
    const result = await db.query(
      `UPDATE clients 
       SET company_name = $1,
           vat_number = $2,
           business = $3,
           country = $4,
           address = $5,
           city = $6,
           zip_code = $7,
           company_email = $8,
           company_phone = $9,
           pec = $10,
           sdi = $11,
           province = $12,
           region = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        data.company_name,
        data.vat_number.toUpperCase(),
        data.business,
        data.country,
        data.address,
        data.city,
        data.zip_code,
        data.company_email.toLowerCase(),
        data.company_phone,
        data.pec?.toLowerCase() || null,
        data.sdi?.toUpperCase() || null,
        data.province,
        data.region,
        id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    console.log('Cliente aggiornato:', result.rows[0])
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    })

  } catch (error) {
    console.log('=== ERRORE API ===')
    console.error('Errore:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Errore interno del server'
      },
      { status: 500 }
    )
  } finally {
    console.log('=== FINE API ===')
  }
} 