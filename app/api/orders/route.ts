import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const clientId = request.cookies.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { rows } = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.status,
        o.created_at,
        COALESCE(
          (SELECT SUM(op.quantity * op.price)
           FROM order_products op
           WHERE op.order_id = o.id),
          0
        ) as total_amount,
        json_build_object(
          'nome', c.nome,
          'brand', json_build_object(
            'name', b.name
          )
        ) as catalog
      FROM orders o
      JOIN cataloghi c ON o.catalog_id = c.id
      JOIN brands b ON c.brand_id = b.id
      WHERE o.client_id = $1
      ORDER BY o.created_at DESC
    `, [clientId])

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Errore nel recupero degli ordini:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli ordini' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const clientId = request.cookies.get('client_id')?.value
    const data = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Create new order
    const { rows: [order] } = await db.query(`
      INSERT INTO orders (
        order_number,
        client_id,
        catalog_id,
        order_type,
        status
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        'bozza'
      )
      RETURNING *
    `, [
      `ORD${Date.now()}`, // Generate order number
      clientId,
      data.catalog_id,
      data.order_type
    ])

    return NextResponse.json(order)
  } catch (error) {
    console.error('Errore nella creazione dell\'ordine:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'ordine' },
      { status: 500 }
    )
  }
}