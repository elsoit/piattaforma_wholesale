import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = params.clientId

    // Query per ottenere i brand associati al client_id
    const { rows } = await sql`
      SELECT b.* 
      FROM brands b
      JOIN client_brands cb ON b.id = cb.brand_id
      WHERE cb.client_id = ${clientId}
      ORDER BY b.name ASC
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Errore nel recupero dei brand:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
} 