import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { article_code, variant_code, size_group_id, brand_id, status } = body

    if (!article_code || !variant_code || !size_group_id || !brand_id || !status) {
      return NextResponse.json(
        { error: 'Parametri mancanti per l\'eliminazione' },
        { status: 400 }
      )
    }

    await db.query('BEGIN')

    try {
      // Prima troviamo gli ID dei prodotti che vogliamo eliminare
      const { rows: products } = await db.query(
        `SELECT id 
         FROM products 
         WHERE article_code = $1 
         AND variant_code = $2 
         AND size_group_id = $3 
         AND brand_id = $4
         AND status = $5`,
        [article_code, variant_code, size_group_id, brand_id, status]
      )

      if (products.length === 0) {
        await db.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Nessun prodotto trovato da eliminare' },
          { status: 404 }
        )
      }

      const productIds = products.map(p => p.id)

      // Verifichiamo se qualche prodotto è presente negli ordini
      const { rows: ordersWithProducts } = await db.query(
        `SELECT DISTINCT product_id 
         FROM order_products 
         WHERE product_id = ANY($1::int[])`,
        [productIds]
      )

      if (ordersWithProducts.length > 0) {
        await db.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Impossibile eliminare i prodotti perché sono presenti in uno o più ordini' },
          { status: 400 }
        )
      }

      // Se nessun prodotto è presente negli ordini, procediamo con l'eliminazione
      const { rowCount } = await db.query(
        `DELETE FROM products 
         WHERE article_code = $1 
         AND variant_code = $2 
         AND size_group_id = $3 
         AND brand_id = $4
         AND status = $5`,
        [article_code, variant_code, size_group_id, brand_id, status]
      )

      await db.query('COMMIT')

      return NextResponse.json({ 
        message: `${rowCount} prodotti eliminati con successo`,
        deletedCount: rowCount
      })

    } catch (error) {
      await db.query('ROLLBACK')
      console.error('Errore durante l\'eliminazione:', error)
      throw error
    }
  } catch (error) {
    console.error('Errore nella cancellazione di gruppo:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione di gruppo' },
      { status: 500 }
    )
  }
}