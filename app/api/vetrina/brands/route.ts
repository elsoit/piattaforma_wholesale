import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value
    const clientId = cookieStore.get('client_id')?.value

    if (!sessionId || !clientId) {
      console.log('Sessione o client_id mancante')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Verifica che il client_id appartenga all'utente loggato
    const { rows: [client] } = await db.query(`
      SELECT c.id 
      FROM clients c
      WHERE c.id = $1 AND c.user_id = $2
    `, [clientId, sessionId])

    if (!client) {
      console.log('Cliente non autorizzato')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Recupera i brand associati al cliente
    const { rows: brands } = await db.query(`
      SELECT DISTINCT b.id, b.name, b.description, b.logo
      FROM brands b
      INNER JOIN client_brands cb ON b.id = cb.brand_id
      WHERE cb.client_id = $1
      ORDER BY b.name
    `, [clientId])

    console.log(`Trovati ${brands.length} brand per il cliente ${clientId}`)
    return NextResponse.json(brands)

  } catch (error) {
    console.error('Errore nel recupero dei brand:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const clientId = await getClientId()
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const brandIds = Array.isArray(data.brandIds) ? data.brandIds : []

    // Inizia una transazione
    await db.query('BEGIN')

    try {
      // Rimuovi tutte le associazioni esistenti
      await db.query(
        'DELETE FROM clients_brands WHERE client_id = $1',
        [clientId]
      )

      // Inserisci le nuove associazioni
      if (brandIds.length > 0) {
        const values = brandIds.map((brandId: string) => `($1, $2)`).join(',')
        await db.query(
          `INSERT INTO clients_brands (client_id, brand_id) VALUES ${values}`,
          [clientId, ...brandIds]
        )
      }

      await db.query('COMMIT')

      // Recupera i brand aggiornati
      const { rows: brands } = await db.query(`
        SELECT b.* 
        FROM brands b
        INNER JOIN clients_brands cb ON b.id = cb.brand_id
        WHERE cb.client_id = $1
        ORDER BY b.name
      `, [clientId])

      return NextResponse.json(brands)

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Errore nell\'aggiornamento dei brand del cliente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dei brand' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const clientId = await getClientId()
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const brandId = url.searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json(
        { error: 'ID brand non fornito' },
        { status: 400 }
      )
    }

    const { rows } = await db.query(
      'DELETE FROM clients_brands WHERE client_id = $1 AND brand_id = $2 RETURNING *',
      [clientId, brandId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Associazione non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Errore nella rimozione del brand:', error)
    return NextResponse.json(
      { error: 'Errore nella rimozione del brand' },
      { status: 500 }
    )
  }
} 