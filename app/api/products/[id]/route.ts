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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

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

      // Verifica se esiste già un altro prodotto con lo stesso codice (ignorando i caratteri speciali)
      if (validatedData.article_code) {
        const { rows: existing } = await db.query(
          `SELECT id FROM products 
           WHERE TRANSLATE(UPPER(article_code), '-./'' ', '') = TRANSLATE(UPPER($1), '-./'' ', '')
           AND variant_code = $2 
           AND size_id = $3
           AND id != $4`,
          [validatedData.article_code, validatedData.variant_code, validatedData.size_id, params.id]
        )

        if (existing.length > 0) {
          return NextResponse.json(
            { error: 'Esiste già un altro prodotto con questa combinazione di codici e taglia' },
            { status: 400 }
          )
        }
      }

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
          params.id
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rows } = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Prodotto non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Errore nella cancellazione del prodotto:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione del prodotto' },
      { status: 500 }
    )
  }
} 