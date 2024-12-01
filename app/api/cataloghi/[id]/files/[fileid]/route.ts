import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { catalogoId: string, id: string } }
) {
  try {
    const cookieStore = await cookies()
    const clientId = cookieStore.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { rows: [file] } = await db.query(`
      SELECT f.* 
      FROM catalogo_files f
      INNER JOIN cataloghi c ON f.catalogo_id = c.id
      INNER JOIN client_brands cb ON c.brand_id = cb.brand_id
      WHERE f.id = $1 AND f.catalogo_id = $2 AND cb.client_id = $3
    `, [params.id, params.catalogoId, clientId])

    if (!file) {
      return NextResponse.json(
        { error: 'File non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error('Errore nel recupero del file:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del file' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { catalogoId: string, id: string } }
) {
  try {
    const data = await request.json()
    const cookieStore = await cookies()
    const clientId = cookieStore.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Verifica l'accesso al file
    const { rows: [check] } = await db.query(`
      SELECT 1 FROM catalogo_files f
      INNER JOIN cataloghi c ON f.catalogo_id = c.id
      INNER JOIN client_brands cb ON c.brand_id = cb.brand_id
      WHERE f.id = $1 AND f.catalogo_id = $2 AND cb.client_id = $3
    `, [params.id, params.catalogoId, clientId])

    if (!check) {
      return NextResponse.json(
        { error: 'File non autorizzato' },
        { status: 403 }
      )
    }

    const { rows: [file] } = await db.query(`
      UPDATE catalogo_files SET
        nome = $1,
        description = $2,
        tipo = $3,
        file_url = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND catalogo_id = $6
      RETURNING *
    `, [
      data.nome,
      data.description,
      data.tipo,
      data.file_url,
      params.id,
      params.catalogoId
    ])

    return NextResponse.json(file)
  } catch (error) {
    console.error('Errore nell\'aggiornamento del file:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { catalogoId: string, id: string } }
) {
  try {
    const cookieStore = await cookies()
    const clientId = cookieStore.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Verifica l'accesso al file
    const { rows: [check] } = await db.query(`
      SELECT 1 FROM catalogo_files f
      INNER JOIN cataloghi c ON f.catalogo_id = c.id
      INNER JOIN client_brands cb ON c.brand_id = cb.brand_id
      WHERE f.id = $1 AND f.catalogo_id = $2 AND cb.client_id = $3
    `, [params.id, params.catalogoId, clientId])

    if (!check) {
      return NextResponse.json(
        { error: 'File non autorizzato' },
        { status: 403 }
      )
    }

    await db.query(`
      DELETE FROM catalogo_files
      WHERE id = $1 AND catalogo_id = $2
    `, [params.id, params.catalogoId])

    return NextResponse.json({ message: 'File eliminato con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione del file:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del file' },
      { status: 500 }
    )
  }
} 