import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const productSchema = z.object({
  article_code: z.string(),
  variant_code: z.string(),
  size_id: z.number(),
  size_group_id: z.number(),
  brand_id: z.string(),
  wholesale_price: z.number().positive(),
  retail_price: z.union([
    z.number().positive(),
    z.literal(null)
  ]),
  status: z.enum(['active', 'inactive']).default('active')
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '30')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const brand = searchParams.get('brand')

    // Costruisci la query base
    let queryText = `
      SELECT 
        p.*,
        b.name as brand_name,
        s.name as size_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN sizes s ON p.size_id = s.id
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramCount = 1

    // Aggiungi filtri se presenti
    if (search) {
      queryText += ` AND (
        p.article_code ILIKE $${paramCount} OR 
        p.variant_code ILIKE $${paramCount} OR 
        b.name ILIKE $${paramCount}
      )`
      queryParams.push(`%${search}%`)
      paramCount++
    }

    if (status) {
      queryText += ` AND p.status = $${paramCount}`
      queryParams.push(status)
      paramCount++
    }

    if (brand) {
      queryText += ` AND b.name = $${paramCount}`
      queryParams.push(brand)
      paramCount++
    }

    // Query per il conteggio totale
    const countQuery = `
      SELECT COUNT(*) 
      FROM (${queryText}) as count_query
    `
    const { rows: [{ count }] } = await db.query(countQuery, queryParams)
    const total = parseInt(count)

    // Aggiungi ordinamento e paginazione
    queryText += ` 
      ORDER BY p.created_at DESC, p.article_code, p.variant_code, s.name
    `

    // Se pageSize è -1, restituisci tutti i risultati
    if (pageSize !== -1) {
      queryText += `
        LIMIT $${paramCount} 
        OFFSET $${paramCount + 1}
      `
      queryParams.push(pageSize, (page - 1) * pageSize)
    }

    const { rows: products } = await db.query(queryText, queryParams)

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: pageSize === -1 ? 1 : Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Errore nel recupero dei prodotti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei prodotti' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Formatta il codice articolo
    const formattedBody = {
      ...body,
      article_code: body.article_code
        .replace(/[./'\s]/g, '-')
        .replace(/-+/g, '-')
        .toUpperCase()
        .trim(),
      retail_price: body.retail_price === '' ? null : body.retail_price
    }

    const result = productSchema.safeParse(formattedBody)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dati non validi' },
        { status: 400 }
      )
    }

    // Verifica se esiste già un prodotto con lo stesso codice articolo (ignorando i caratteri speciali)
    const { rows: existing } = await db.query(
      `SELECT id FROM products 
       WHERE TRANSLATE(UPPER(article_code), '-./'' ', '') = TRANSLATE(UPPER($1), '-./'' ', '')
       AND variant_code = $2 
       AND size_id = $3`,
      [result.data.article_code, result.data.variant_code, result.data.size_id]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Prodotto già esistente con questa combinazione di codici e taglia' },
        { status: 400 }
      )
    }

    const { rows: [product] } = await db.query(
      `INSERT INTO products (
        article_code, variant_code, size_id, size_group_id, 
        brand_id, wholesale_price, retail_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        result.data.article_code,
        result.data.variant_code,
        result.data.size_id,
        result.data.size_group_id,
        result.data.brand_id,
        result.data.wholesale_price,
        result.data.retail_price,
        result.data.status
      ]
    )

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione del prodotto:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del prodotto' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    console.log('Dati ricevuti:', body)
    
    // Formatta il codice articolo se presente
    if (body.article_code) {
      body.article_code = body.article_code
        .replace(/[./'\s]/g, '-')
        .replace(/-+/g, '-')
        .toUpperCase()
        .trim()
    }

    // Prepara i dati per la validazione
    const dataToValidate = {
      ...body,
      retail_price: body.retail_price === '' ? null : body.retail_price
    }

    try {
      const validatedData = productSchema.parse(dataToValidate)
      console.log('Dati validati:', validatedData)

      const { rows } = await db.query(
        `UPDATE products 
         SET article_code = COALESCE($1, article_code),
             variant_code = COALESCE($2, variant_code),
             size_id = COALESCE($3, size_id),
             size_group_id = COALESCE($4, size_group_id),
             brand_id = COALESCE($5, brand_id),
             wholesale_price = COALESCE($6, wholesale_price),
             retail_price = $7,
             status = COALESCE($8, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [
          validatedData.article_code,
          validatedData.variant_code,
          validatedData.size_id,
          validatedData.size_group_id,
          validatedData.brand_id,
          validatedData.wholesale_price,
          validatedData.retail_price,
          validatedData.status,
          body.id
        ]
      )

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Prodotto non trovato' },
          { status: 404 }
        )
      }

      return NextResponse.json(rows[0])
    } catch (validationError) {
      console.error('Errore validazione:', validationError)
      return NextResponse.json(
        { error: 'Dati non validi', details: validationError },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento del prodotto:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del prodotto' },
      { status: 500 }
    )
  }
} 