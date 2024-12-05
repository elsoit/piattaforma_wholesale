import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClientSchema, updateClientSchema } from '@/types/api-requests'
import { createErrorResponse } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Recupera tutti i clients
export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        u.id as user_id,
        u.nome,
        u.cognome,
        u.email,
        u.attivo,
        u.email_verified,
        u.email_verified_at
      FROM clients c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.stato != 'eliminata'
      ORDER BY c.created_at DESC
    `)

    // Formatta i risultati per includere i dati dell'utente nidificati
    const clients = result.rows.map(row => ({
      id: row.id,
      codice: row.codice,
      company_name: row.company_name,
      vat_number: row.vat_number,
      business: row.business,
      country: row.country,
      address: row.address,
      city: row.city,
      zip_code: row.zip_code,
      province: row.province,
      region: row.region,
      company_email: row.company_email,
      company_phone: row.company_phone,
      pec: row.pec,
      sdi: row.sdi,
      stato: row.stato,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        nome: row.nome,
        cognome: row.cognome,
        email: row.email,
        attivo: row.attivo,
        email_verified: row.email_verified,
        email_verified_at: row.email_verified_at
      }
    }))

    return NextResponse.json(clients)
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
    const validatedData = createClientSchema.parse(body)
    
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
    } = validatedData

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
    const validatedData = updateClientSchema.parse(body)
    const { id, stato, attivo } = validatedData

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