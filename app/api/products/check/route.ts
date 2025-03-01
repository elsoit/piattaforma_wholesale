import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Check prodotto, body ricevuto:', body)

    if (!body.article_code || !body.variant_code || !body.size_id) {
      return NextResponse.json(
        { error: 'Dati mancanti' },
        { status: 400 }
      )
    }

    // Query che rimuove TUTTI i caratteri speciali per il confronto puro
    const { rows: existing } = await db.query(
      `SELECT id FROM products 
       WHERE TRANSLATE(UPPER(article_code), '-./'' ', '') = TRANSLATE(UPPER($1), '-./'' ', '')
       AND variant_code = $2 
       AND size_id = $3`,
      [body.article_code, body.variant_code, body.size_id]
    )

    const exists = existing.length > 0
    const product_id = exists ? existing[0].id : null

    console.log('Prodotto trovato:', { exists, product_id })

    return NextResponse.json({ 
      exists, 
      product_id 
    })

  } catch (error) {
    console.error('Errore check prodotto:', error)
    return NextResponse.json(
      { error: 'Errore nella verifica del prodotto' },
      { status: 500 }
    )
  }
}