import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  context: { params: { brandId: string } }
) {
  try {
    const brandId = context.params.brandId

    const { rows } = await db.query(`
      SELECT 
        id,
        nome,
        codice,
        tipo,
        stagione,
        anno,
        cover_url,
        stato,
        data_inizio_ordini,
        data_fine_ordini,
        data_consegna,
        note,
        condizioni,
        created_at,
        updated_at
      FROM cataloghi 
      WHERE brand_id = $1 
      AND stato = 'pubblicato'
      ORDER BY created_at DESC
    `, [brandId])

    console.log('Cataloghi trovati:', rows)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Errore nel recupero dei cataloghi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei cataloghi' },
      { status: 500 }
    )
  }
} 