import { NextRequest, NextResponse } from "next/server"
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const clientId = req.cookies.get('client_id')?.value
    
    if (!clientId) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const searchQuery = req.nextUrl.searchParams.get("q")
    const brandId = req.nextUrl.searchParams.get("brand_id")
    const variantCode = req.nextUrl.searchParams.get("variant")

    console.log('Ricerca prodotti:', {
      searchQuery,
      brandId,
      variantCode,
      clientId,
      timestamp: new Date().toISOString()
    })

    if (!searchQuery || !brandId) {
      console.log('Parametri mancanti:', { searchQuery, brandId })
      return NextResponse.json({ error: "Query di ricerca o brand mancante" }, { status: 400 })
    }

    // Query SQL base
    let whereClause = `
      status = 'active' AND
      brand_id = $1 AND
      article_code ILIKE $2
    `
    let params = [brandId, `%${searchQuery}%`]

    // Se è specificata la variante, aggiungi la condizione
    if (variantCode) {
      whereClause += ` AND variant_code = $${params.length + 1}`
      params.push(variantCode)
    }

    // Prima query per ottenere le combinazioni uniche
    const uniqueCombosQuery = `
      SELECT DISTINCT ON (article_code, variant_code)
        article_code,
        variant_code
      FROM products
      WHERE ${whereClause}
      ORDER BY article_code, variant_code
      LIMIT 10
    `

    const { rows: uniqueCombos } = await db.query(uniqueCombosQuery, params)

    // Per ogni combinazione, ottieni tutti i prodotti associati
    const results = []
    for (const combo of uniqueCombos) {
      const productsQuery = `
        WITH product_info AS (
          SELECT DISTINCT ON (p.article_code, p.variant_code)
            p.article_code,
            p.variant_code,
            p.size_group_id,
            p.brand_id,
            p.wholesale_price,
            p.retail_price
          FROM products p
          WHERE 
            p.status = 'active' AND
            p.brand_id = $1 AND
            p.article_code = $2 AND
            p.variant_code = $3
        )
        SELECT 
          p.*,
          s.id as size_id,
          s.name as size_name,
          pr.id as product_id
        FROM product_info p
        JOIN products pr ON 
          pr.article_code = p.article_code AND
          pr.variant_code = p.variant_code AND
          pr.status = 'active'
        JOIN sizes s ON s.id = pr.size_id
        WHERE pr.id IS NOT NULL
      `
      
      const { rows: products } = await db.query(productsQuery, [
        brandId,
        combo.article_code,
        combo.variant_code
      ])

      // Verifica che tutti i prodotti abbiano gli stessi dati tranne la taglia
      if (products.length > 0) {
        const firstProduct = products[0]
        const allSameExceptSize = products.every(p => 
          p.wholesale_price === firstProduct.wholesale_price &&
          p.size_group_id === firstProduct.size_group_id &&
          p.brand_id === firstProduct.brand_id
        )

        if (allSameExceptSize) {
          results.push({
            article_code: firstProduct.article_code,
            variant_code: firstProduct.variant_code,
            size_group_id: firstProduct.size_group_id,
            brand_id: firstProduct.brand_id,
            wholesale_price: firstProduct.wholesale_price,
            retail_price: firstProduct.retail_price,
            sizes: products.map(p => ({
              id: p.size_id,
              name: p.size_name,
              product_id: p.product_id // Salviamo il product_id per ogni taglia
            }))
          })
        }
      }
    }

    console.log('Risultati trovati:', {
      count: results.length,
      firstResult: results[0],
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Errore nella ricerca prodotti:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: "Errore durante la ricerca dei prodotti" },
      { status: 500 }
    )
  }
}
