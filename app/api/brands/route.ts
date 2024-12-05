import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createBrandSchema, updateBrandSchema } from '@/types/api-requests'
import { createErrorResponse, createSuccessResponse } from '@/types/api'
import { v4 as uuidv4 } from 'uuid'

// GET: Recupera tutti i brand
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let query = 'SELECT * FROM brands'
    const params: any[] = []

    if (search) {
      query += ' WHERE name ILIKE $1'
      params.push(`%${search}%`)
    }

    // Conta totale
    const countResult = await db.query(
      `SELECT COUNT(*) FROM (${query}) as count`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Query paginata
    query += ' ORDER BY name ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
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
    console.error('Errore nel recupero dei brand:', error)
    return NextResponse.json(
      createErrorResponse('Errore nel recupero dei brand'),
      { status: 500 }
    )
  }
}

// POST: Crea un nuovo brand
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createBrandSchema.parse(body)

    // Verifica duplicati
    const existing = await db.query(
      'SELECT id FROM brands WHERE LOWER(name) = LOWER($1)',
      [data.name]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        createErrorResponse('Brand già esistente'),
        { status: 400 }
      )
    }

    const id = uuidv4()
    const result = await db.query(
      `INSERT INTO brands (id, name, description, logo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, data.name, data.description, data.logo]
    )

    return NextResponse.json(
      createSuccessResponse(result.rows[0]),
      { status: 201 }
    )

  } catch (error) {
    console.error('Errore nella creazione del brand:', error)
    return NextResponse.json(
      createErrorResponse('Errore nella creazione del brand'),
      { status: 500 }
    )
  }
}

// PUT: Aggiorna un brand esistente
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const data = updateBrandSchema.parse(body)

    if (!data.id) {
      return NextResponse.json(
        createErrorResponse('ID brand mancante'),
        { status: 400 }
      )
    }

    // Verifica duplicati escludendo il brand corrente
    if (data.name) {
      const existing = await db.query(
        'SELECT id FROM brands WHERE LOWER(name) = LOWER($1) AND id != $2',
        [data.name, data.id]
      )

      if (existing.rows.length > 0) {
        return NextResponse.json(
          createErrorResponse('Brand già esistente'),
          { status: 400 }
        )
      }
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
      `UPDATE brands 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, ...values]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        createErrorResponse('Brand non trovato'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse(result.rows[0])
    )

  } catch (error) {
    console.error('Errore nell\'aggiornamento del brand:', error)
    return NextResponse.json(
      createErrorResponse('Errore nell\'aggiornamento del brand'),
      { status: 500 }
    )
  }
} 