import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    if (!clientId) {
      return NextResponse.json(
        { error: 'ID cliente non fornito' },
        { status: 400 }
      )
    }

    // Verifica che il cliente esista
    const { rows: [client] } = await db.query(
      'SELECT id FROM clients WHERE id = $1',
      [clientId]
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Recupera i brand richiesti dal cliente
    const { rows } = await db.query(`
      SELECT cbi.*, b.name as brand_name 
      FROM client_brand_interests cbi
      JOIN brands b ON b.id = cbi.brand_id
      WHERE cbi.client_id = $1
      ORDER BY b.name ASC
    `, [clientId])

    return NextResponse.json({ 
      data: rows,
      success: true 
    })

  } catch (error) {
    console.error('Errore nel recupero dei brand richiesti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand richiesti' },
      { status: 500 }
    )
  }
}