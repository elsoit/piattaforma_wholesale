import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Ottiene i brand associati al cliente
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientBrands = await db.query(
      `SELECT b.* 
       FROM brands b
       INNER JOIN client_brands cb ON b.id = cb.brand_id
       WHERE cb.client_id = $1`,
      [params.id]
    )

    return NextResponse.json({ data: clientBrands.rows })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
}

// PUT: Aggiorna i brand associati al cliente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { brandIds } = await request.json()
    
    // Inizia una transazione
    await db.query('BEGIN')

    // Rimuove tutte le associazioni esistenti
    await db.query(
      'DELETE FROM client_brands WHERE client_id = $1',
      [params.id]
    )

    // Inserisce le nuove associazioni
    if (brandIds.length > 0) {
      const values = brandIds.map((brandId: string) => 
        `(${params.id}, '${brandId}')`
      ).join(',')
      
      await db.query(`
        INSERT INTO client_brands (client_id, brand_id)
        VALUES ${values}
      `)
    }

    await db.query('COMMIT')

    return NextResponse.json({ 
      success: true, 
      message: 'Brand aggiornati con successo' 
    })
  } catch (error) {
    await db.query('ROLLBACK')
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dei brand' },
      { status: 500 }
    )
  }
} 