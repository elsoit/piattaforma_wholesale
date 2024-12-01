import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { catalogoId: string } }
) {
  try {
    const catalogoId = parseInt(params.catalogoId)
    if (isNaN(catalogoId)) {
      return NextResponse.json(
        { error: 'ID catalogo non valido' },
        { status: 400 }
      )
    }

    const { rows: [catalogo] } = await db.query(`
      SELECT c.*, b.name as brand_name
      FROM cataloghi c
      LEFT JOIN brands b ON c.brand_id = b.id
      WHERE c.id = $1
    `, [catalogoId])

    if (!catalogo) {
      return NextResponse.json(
        { error: 'Catalogo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(catalogo)
  } catch (error) {
    console.error('Errore nel recupero del catalogo:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del catalogo' },
      { status: 500 }
    )
  }
}