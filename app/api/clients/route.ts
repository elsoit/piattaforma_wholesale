import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Recupera tutti i clients
export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'nome', u.nome,
          'cognome', u.cognome,
          'email', u.email,
          'attivo', u.attivo
        ) as user
      FROM clients c
      INNER JOIN users u ON c.user_id = u.id
      ORDER BY c.company_name ASC
    `)

    // Log per debug
    console.log('Clients query result:', result.rows)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Errore nel recupero dei clienti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei clienti' },
      { status: 500 }
    )
  }
}

// POST: Crea un nuovo client
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      company_name,
      vat_number,
      business,
      country,
      address,
      city,
      zip_code,
      company_email,
      company_phone,
      pec,
      sdi,
      user_id,
      stato = 'inattivo',
      attivo = true
    } = body

    // Verifica se esiste già una partita IVA uguale
    const existingVat = await db.query(
      'SELECT id FROM clients WHERE vat_number = $1',
      [vat_number.toUpperCase()]
    )

    if (existingVat.rows.length > 0) {
      return NextResponse.json(
        { error: 'Partita IVA già registrata' },
        { status: 400 }
      )
    }

    // Verifica se l'utente esiste
    const userExists = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    )

    if (userExists.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Validazione per aziende italiane
    if (country === 'IT' && !pec && !sdi) {
      return NextResponse.json(
        { error: 'Per le aziende italiane è necessario specificare almeno PEC o codice SDI' },
        { status: 400 }
      )
    }

    // Inserimento nuovo client
    const result = await db.query(
      `INSERT INTO clients (
        company_name,
        vat_number,
        business,
        country,
        address,
        city,
        zip_code,
        company_email,
        company_phone,
        pec,
        sdi,
        user_id,
        stato,
        attivo,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [
        company_name,
        vat_number.toUpperCase(),
        business,
        country,
        address,
        city,
        zip_code,
        company_email.toLowerCase(),
        company_phone,
        pec?.toLowerCase() || null,
        sdi?.toUpperCase() || null,
        user_id,
        stato,
        attivo
      ]
    )

    // Il codice cliente verrà generato automaticamente dal trigger che abbiamo creato

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione del client:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del client' },
      { status: 500 }
    )
  }
}

// PUT: Aggiorna lo stato di un client
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, stato, attivo } = body

    const result = await db.query(
      `UPDATE clients 
       SET stato = $1, 
           attivo = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [stato, attivo, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Client non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Errore nell\'aggiornamento del client:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del client' },
      { status: 500 }
    )
  }
} 