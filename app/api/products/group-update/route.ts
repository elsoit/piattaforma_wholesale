import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { article_code, variant_code, size_group_id, brand_id, updates } = body

    await db.query('BEGIN')

    try {
      const { rowCount } = await db.query(
        `UPDATE products 
         SET 
           article_code = REPLACE(REPLACE(REPLACE(UPPER($1), '.', '-'), '/', '-'), '''', '-'),
           variant_code = $2,
           brand_id = $3,
           wholesale_price = $4,
           retail_price = COALESCE($5, retail_price),
           status = $6,
           updated_at = NOW()
         WHERE 
           article_code = $7 AND
           variant_code = $8 AND
           size_group_id = $9 AND
           brand_id = $10`,
        [
          updates.article_code,
          updates.variant_code,
          updates.brand_id,
          updates.wholesale_price,
          updates.retail_price,
          updates.status,
          article_code,
          variant_code,
          size_group_id,
          brand_id
        ]
      )

      await db.query('COMMIT')

      return NextResponse.json({ 
        message: 'Prodotti aggiornati con successo',
        updatedCount: rowCount 
      })
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento di gruppo:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento di gruppo' },
      { status: 500 }
    )
  }
} 