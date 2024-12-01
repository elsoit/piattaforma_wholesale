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

    // Recupera i cataloghi dei brand associati al cliente
    const { rows: cataloghi } = await db.query(`
      SELECT c.*, b.name as brand_name 
      FROM cataloghi c
      INNER JOIN brands b ON c.brand_id = b.id
      INNER JOIN client_brands cb ON b.id = cb.brand_id
      WHERE cb.client_id = $1
      ORDER BY c.created_at DESC
    `, [clientId])

    return NextResponse.json(cataloghi)
  } catch (error) {
    console.error('Errore nel recupero dei cataloghi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei cataloghi' },
      { status: 500 }
    )
  }
}

