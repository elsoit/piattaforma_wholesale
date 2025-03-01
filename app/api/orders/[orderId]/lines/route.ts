import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  context: { params: { orderId: string } }
) {
  try {
    const clientId = request.cookies.get('client_id')?.value
    const orderId = context.params.orderId
    const body = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Verifica che l'ordine appartenga al cliente
    const { rows: [order] } = await db.query(
      `SELECT id FROM orders WHERE id = $1 AND client_id = $2`,
      [orderId, clientId]
    )

    if (!order) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      )
    }

    // Inserisce la nuova riga
    const { rows: [line] } = await db.query(`
      WITH inserted_line AS (
        INSERT INTO order_lines (
          order_id,
          article_code,
          variant_code,
          size_group_id,
          size_id,
          price,
          quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, article_code, variant_code, size_group_id, size_id, price, quantity
      )
      SELECT 
        il.*,
        (SELECT COALESCE(SUM(quantity), 0) 
         FROM order_lines ol 
         WHERE ol.order_id = $1 
         AND ol.article_code = il.article_code 
         AND ol.variant_code = il.variant_code) as total_quantity,
        (SELECT COALESCE(SUM(quantity * price), 0) 
         FROM order_lines ol 
         WHERE ol.order_id = $1 
         AND ol.article_code = il.article_code 
         AND ol.variant_code = il.variant_code) as total_amount
      FROM inserted_line il
    `, [
      orderId,
      body.article_code,
      body.variant_code,
      body.size_group_id,
      body.size_id,
      body.price,
      body.quantity
    ])

    return NextResponse.json(line)
  } catch (error) {
    console.error('Errore nel salvataggio della riga:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio della riga' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: { orderId: string } }
) {
  try {
    const clientId = request.cookies.get('client_id')?.value
    const orderId = context.params.orderId
    const body = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Verifica che l'ordine appartenga al cliente
    const { rows: [order] } = await db.query(
      `SELECT id FROM orders WHERE id = $1 AND client_id = $2`,
      [orderId, clientId]
    )

    if (!order) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      )
    }

    // Aggiorna la riga esistente
    const { rows: [line] } = await db.query(`
      WITH updated_line AS (
        UPDATE order_lines
        SET 
          article_code = $1,
          variant_code = $2,
          size_group_id = $3,
          size_id = $4,
          price = $5,
          quantity = $6
        WHERE id = $7 AND order_id = $8
        RETURNING id, article_code, variant_code, size_group_id, size_id, price, quantity
      )
      SELECT 
        ul.*,
        (SELECT COALESCE(SUM(quantity), 0) 
         FROM order_lines ol 
         WHERE ol.order_id = $8 
         AND ol.article_code = ul.article_code 
         AND ol.variant_code = ul.variant_code) as total_quantity,
        (SELECT COALESCE(SUM(quantity * price), 0) 
         FROM order_lines ol 
         WHERE ol.order_id = $8 
         AND ol.article_code = ul.article_code 
         AND ol.variant_code = ul.variant_code) as total_amount
      FROM updated_line ul
    `, [
      body.article_code,
      body.variant_code,
      body.size_group_id,
      body.size_id,
      body.price,
      body.quantity,
      body.id,
      orderId
    ])

    return NextResponse.json(line)
  } catch (error) {
    console.error('Errore nell\'aggiornamento della riga:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della riga' },
      { status: 500 }
    )
  }
} 