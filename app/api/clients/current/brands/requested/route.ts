import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const clientId = cookieStore.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
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