import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCatalogoSchema, updateCatalogoSchema } from '@/types/api-requests'
import { createErrorResponse, createSuccessResponse } from '@/types/api'

// GET: Recupera cataloghi con paginazione e filtri
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const brandId = searchParams.get('brandId')
    const stato = searchParams.get('stato')
    const tipo = searchParams.get('tipo')
    const stagione = searchParams.get('stagione')
    const anno = searchParams.get('anno')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit
    const params: any[] = []
    let paramCount = 1

    // Costruisci la query base
    let query = `
      SELECT c.*, b.name as brand_name 
      FROM cataloghi c
      JOIN brands b ON c.brand_id = b.id
      WHERE 1=1
    `

    // Aggiungi i filtri
    if (brandId) {
      query += ` AND c.brand_id = $${paramCount++}`
      params.push(brandId)
    }

    if (stato) {
      query += ` AND c.stato = $${paramCount++}`
      params.push(stato)
    }

    if (tipo) {
      query += ` AND c.tipo = $${paramCount++}`
      params.push(tipo)
    }

    if (stagione) {
      query += ` AND c.stagione = $${paramCount++}`
      params.push(stagione)
    }

    if (anno) {
      query += ` AND c.anno = $${paramCount++}`
      params.push(parseInt(anno))
    }

    if (search) {
      query += ` AND (c.nome ILIKE $${paramCount} OR c.codice ILIKE $${paramCount})`
      params.push(`%${search}%`)
      paramCount++
    }

    // Conta totale
    const countResult = await db.query(
      `SELECT COUNT(*) FROM (${query}) as count`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Query paginata
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`
    params.push(limit, offset)

    const result = await db.query(query, params)

    return NextResponse.json({
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Errore nel recupero dei cataloghi:', error)
    return NextResponse.json(
      createErrorResponse('Errore nel recupero dei cataloghi'),
      { status: 500 }
    )
  }
}

// POST: Crea un nuovo catalogo
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createCatalogoSchema.parse(body)

    // Verifica che il brand esista
    const brandExists = await db.query(
      'SELECT id FROM brands WHERE id = $1',
      [data.brand_id]
    )

    if (!brandExists.rows.length) {
      return NextResponse.json(
        createErrorResponse('Brand non trovato'),
        { status: 404 }
      )
    }

    // Genera codice univoco
    const codice = await generateCatalogoCode()

    const result = await db.query(
      `INSERT INTO cataloghi (
        codice, nome, brand_id, tipo, stagione, anno,
        data_inizio_ordini, data_fine_ordini, data_consegna,
        note, condizioni, cover_url, stato
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'bozza')
      RETURNING *`,
      [
        codice,
        data.nome,
        data.brand_id,
        data.tipo,
        data.stagione,
        data.anno,
        data.data_inizio_ordini,
        data.data_fine_ordini,
        data.data_consegna,
        data.note,
        data.condizioni,
        data.cover_url
      ]
    )

    return NextResponse.json(
      createSuccessResponse(result.rows[0]),
      { status: 201 }
    )

  } catch (error) {
    console.error('Errore nella creazione del catalogo:', error)
    return NextResponse.json(
      createErrorResponse('Errore nella creazione del catalogo'),
      { status: 500 }
    )
  }
}

// Helper per generare codice catalogo
async function generateCatalogoCode(): Promise<string> {
  const result = await db.query(
    'SELECT MAX(CAST(SUBSTRING(codice FROM 5) AS INTEGER)) as last_num FROM cataloghi WHERE codice LIKE $1',
    ['CATG%']
  )
  
  const lastNum = result.rows[0].last_num || 0
  const newNum = lastNum + 1
  return `CATG${newNum.toString().padStart(9, '0')}`
}

// PUT: Aggiorna un catalogo
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const data = updateCatalogoSchema.parse(body)

    if (!data.id) {
      return NextResponse.json(
        createErrorResponse('ID catalogo mancante'),
        { status: 400 }
      )
    }

    // Verifica che il catalogo esista
    const existing = await db.query(
      'SELECT stato FROM cataloghi WHERE id = $1',
      [data.id]
    )

    if (!existing.rows.length) {
      return NextResponse.json(
        createErrorResponse('Catalogo non trovato'),
        { status: 404 }
      )
    }

    // Non permettere modifiche se il catalogo è archiviato
    if (existing.rows[0].stato === 'archiviato') {
      return NextResponse.json(
        createErrorResponse('Non è possibile modificare un catalogo archiviato'),
        { status: 400 }
      )
    }

    const { id, ...updateData } = data
    const fields = Object.keys(updateData)
    
    if (fields.length === 0) {
      return NextResponse.json(
        createErrorResponse('Nessun dato da aggiornare'),
        { status: 400 }
      )
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
    const values = fields.map(field => updateData[field as keyof typeof updateData])

    const result = await db.query(
      `UPDATE cataloghi 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, ...values]
    )

    return NextResponse.json(
      createSuccessResponse(result.rows[0])
    )

  } catch (error) {
    console.error('Errore nell\'aggiornamento del catalogo:', error)
    return NextResponse.json(
      createErrorResponse('Errore nell\'aggiornamento del catalogo'),
      { status: 500 }
    )
  }
}

