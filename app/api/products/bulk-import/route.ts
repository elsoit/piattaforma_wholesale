import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { products } = await request.json()
    const results = []

    await db.query('BEGIN')

    try {
      for (const product of products) {
        try {
          // Controlla se il prodotto esiste già includendo il brand
          const { rows: existing } = await db.query(
            `SELECT id FROM products 
             WHERE article_code = $1 
             AND variant_code = $2 
             AND size_id = $3 
             AND brand_id = $4`,
            [product.article_code, product.variant_code, product.size_id, product.brand_id]
          )

          if (existing.length > 0) {
            // Ottieni i dettagli per il prodotto duplicato
            const { rows: [details] } = await db.query(
              `SELECT 
                p.*,
                s.name as size_name,
                sg.name as size_group_name,
                b.name as brand_name
               FROM products p
               LEFT JOIN sizes s ON s.id = p.size_id
               LEFT JOIN size_groups sg ON sg.id = p.size_group_id
               LEFT JOIN brands b ON b.id = p.brand_id
               WHERE p.id = $1`,
              [existing[0].id]
            )

            results.push({
              article_code: product.article_code,
              variant_code: product.variant_code,
              size: details.size_name,
              size_group: details.size_group_name,
              brand_id: details.brand_name,
              wholesale_price: product.wholesale_price,
              retail_price: product.retail_price,
              status: 'Duplicato',
              message: 'Prodotto già esistente per questo brand'
            })
            continue
          }

          // Inserisci il nuovo prodotto e ottieni tutti i dettagli
          const { rows: [inserted] } = await db.query(
            `WITH inserted AS (
              INSERT INTO products (
                article_code,
                variant_code,
                size_id,
                size_group_id,
                brand_id,
                wholesale_price,
                retail_price,
                status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *
            )
            SELECT 
              i.*,
              s.name as size_name,
              sg.name as size_group_name,
              b.name as brand_name
            FROM inserted i
            LEFT JOIN sizes s ON s.id = i.size_id
            LEFT JOIN size_groups sg ON sg.id = i.size_group_id
            LEFT JOIN brands b ON b.id = i.brand_id`,
            [
              product.article_code,
              product.variant_code,
              product.size_id,
              product.size_group_id,
              product.brand_id,
              product.wholesale_price,
              product.retail_price,
              product.status
            ]
          )

          results.push({
            ...inserted,
            size: inserted.size_name,
            size_group: inserted.size_group_name,
            brand_id: inserted.brand_name,
            status: 'success'
          })
        } catch (error) {
          console.error('Errore nell\'inserimento del prodotto:', error)
          results.push({
            article_code: product.article_code,
            variant_code: product.variant_code,
            size: product.size_id,
            size_group: product.size_group_id,
            brand_id: product.brand_id,
            wholesale_price: product.wholesale_price,
            retail_price: product.retail_price,
            status: 'error',
            message: 'Errore nell\'inserimento del prodotto'
          })
        }
      }

      await db.query('COMMIT')
      return NextResponse.json(results)
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nell\'importazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'importazione dei prodotti' },
      { status: 500 }
    )
  }
} 