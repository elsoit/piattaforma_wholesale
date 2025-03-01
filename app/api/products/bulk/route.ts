import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { products } = await request.json()

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Nessun prodotto da creare' },
        { status: 400 }
      )
    }

    await db.query('BEGIN')

    try {
      // Array per tenere traccia dei prodotti inseriti e duplicati
      const inserted = []
      const duplicates = []

      // Formatta il codice articolo sostituendo TUTTI i caratteri speciali con "-"
      const formatArticleCode = (code: string) => {
        return code
          .replace(/[./'\s]/g, '-')  // Sostituisce . / ' e spazi con -
          .replace(/-+/g, '-')       // Rimuove trattini multipli consecutivi
          .toUpperCase()             // Converte in maiuscolo
          .trim()                    // Rimuove spazi iniziali e finali
      }

      // Controlla ogni prodotto
      for (const product of products) {
        // Verifica se esiste già
        const { rows: existing } = await db.query(
          `SELECT id FROM products 
           WHERE TRANSLATE(UPPER(article_code), '-./'' ', '') = TRANSLATE(UPPER($1), '-./'' ', '')
           AND variant_code = $2 
           AND size_id = $3
           AND brand_id = $4`,
          [product.article_code, product.variant_code, product.size_id, product.brand_id]
        )

        if (existing.length > 0) {
          duplicates.push(product)
          continue
        }

        // Formatta il codice articolo prima del salvataggio
        const formattedArticleCode = formatArticleCode(product.article_code)

        // Inserisci il nuovo prodotto con il codice articolo formattato
        const { rows: [newProduct] } = await db.query(
          `INSERT INTO products (
            article_code, variant_code, size_id, size_group_id,
            brand_id, wholesale_price, retail_price, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            formattedArticleCode,    // Usa il codice formattato
            product.variant_code,
            product.size_id,
            product.size_group_id,
            product.brand_id,
            Number(product.wholesale_price),
            product.retail_price ? Number(product.retail_price) : null,
            product.status || 'active'
          ]
        )

        inserted.push(newProduct)
      }

      await db.query('COMMIT')

      return NextResponse.json({
        inserted,
        duplicates,
        message: `Inseriti ${inserted.length} prodotti. ${duplicates.length} duplicati ignorati.`
      })

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nella creazione dei prodotti:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dei prodotti' },
      { status: 500 }
    )
  }
} 