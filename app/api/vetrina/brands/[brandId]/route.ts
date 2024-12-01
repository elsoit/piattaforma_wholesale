import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  context: { params: { brandId: string } }
) {
  try {
    const brandId = context.params.brandId

    const { rows: [brand] } = await db.query(`
      SELECT * 
      FROM brands 
      WHERE id = $1
    `, [brandId])

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Errore nel recupero del brand:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del brand' },
      { status: 500 }
    )
  }
} 