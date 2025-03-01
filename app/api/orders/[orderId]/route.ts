import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const clientId = request.cookies.get('client_id')?.value
    const orderId = Number(params.orderId)

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Prima verifichiamo che l'ordine esista e appartenga al cliente
    const { rows: [orderExists] } = await db.query(`
      SELECT id 
      FROM orders 
      WHERE id = $1 AND client_id = $2
    `, [orderId, clientId])

    if (!orderExists) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      )
    }

    // Query principale che recupera l'ordine con tutti i suoi dettagli
    const { rows: [order] } = await db.query(`
      WITH dettagli_ordine AS (
        SELECT 
          o.id,
          o.order_number,
          o.order_type,
          o.status,
          o.created_at,
          json_build_object(
            'id', c.id,
            'nome', c.nome,
            'tipo', c.tipo,
            'stagione', c.stagione,
            'anno', c.anno,
            'brand', json_build_object(
              'id', b.id,
              'name', b.name,
              'logo', b.logo
            )
          ) as catalog
        FROM orders o
        JOIN cataloghi c ON o.catalog_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE o.id = $1
      ),
      order_lines AS (
        SELECT 
          COALESCE(
            json_agg(
              json_build_object(
                'id', op.id,
                'product_id', p.id,
                'article_code', p.article_code,
                'variant_code', p.variant_code,
                'size_group_id', p.size_group_id,
                'size_id', p.size_id,
                'price', op.price,
                'quantity', op.quantity,
                'total_quantity', (
                  SELECT SUM(op2.quantity)
                  FROM order_products op2
                  JOIN products p2 ON op2.product_id = p2.id
                  WHERE op2.order_id = $1
                  AND p2.article_code = p.article_code
                  AND p2.variant_code = p.variant_code
                ),
                'total_amount', (
                  SELECT SUM(op2.quantity * op2.price)
                  FROM order_products op2
                  JOIN products p2 ON op2.product_id = p2.id
                  WHERE op2.order_id = $1
                  AND p2.article_code = p.article_code
                  AND p2.variant_code = p.variant_code
                )
              )
            ),
            '[]'::json
          ) as lines
        FROM order_products op
        JOIN products p ON op.product_id = p.id
        WHERE op.order_id = $1
      )
      SELECT 
        dettagli_ordine.*,
        order_lines.lines
      FROM dettagli_ordine
      LEFT JOIN order_lines ON true;
    `, [orderId])

    if (!order) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)

  } catch (error) {
    console.error('Errore nel recupero dell\'ordine:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore nel recupero dell\'ordine',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

// POST per creare/aggiornare le righe dell'ordine
export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const clientId = request.cookies.get('client_id')?.value
    const orderId = Number(params.orderId)
    const data = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Verifica che l'ordine appartenga al cliente
    const { rows: [orderExists] } = await db.query(`
      SELECT id 
      FROM orders 
      WHERE id = $1 AND client_id = $2
    `, [orderId, clientId])

    if (!orderExists) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      )
    }

    // Aggiorna o inserisce la riga dell'ordine
    const { rows: [orderLine] } = await db.query(`
      INSERT INTO order_products (
        order_id,
        product_id,
        quantity,
        price
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (order_id, product_id) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        price = EXCLUDED.price,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      orderId,
      data.product_id,
      data.quantity,
      data.price
    ])

    return NextResponse.json(orderLine)

  } catch (error) {
    console.error('Errore nell\'aggiornamento della riga ordine:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore nell\'aggiornamento della riga ordine',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const orderIdNum = parseInt(orderId);
    const clientId = request.cookies.get('client_id')?.value;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'ID ordine non valido' },
        { status: 400 }
      )
    }

    await db.query('BEGIN')

    try {
      // Verifica che l'ordine esista e sia in stato bozza
      const { rows: [order] } = await db.query(
        `SELECT id, status FROM orders 
         WHERE id = $1 AND client_id = $2`,
        [orderIdNum, clientId]
      )

      if (!order) {
        return NextResponse.json(
          { error: 'Ordine non trovato' },
          { status: 404 }
        )
      }

      if (order.status !== 'bozza') {
        return NextResponse.json(
          { error: 'Solo gli ordini in bozza possono essere cancellati' },
          { status: 400 }
        )
      }

      // Cancella prima le righe dell'ordine
      await db.query(
        'DELETE FROM order_products WHERE order_id = $1',
        [orderIdNum]
      )

      // Poi cancella l'ordine
      await db.query(
        'DELETE FROM orders WHERE id = $1',
        [orderIdNum]
      )

      await db.query('COMMIT')

      return NextResponse.json({
        message: 'Ordine cancellato con successo'
      })

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nella cancellazione dell\'ordine:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione dell\'ordine' },
      { status: 500 }
    )
  }
}