import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id
    const catalogoId = Number(id)
    
    if (isNaN(catalogoId)) {
      console.error('ID non valido:', id)
      return NextResponse.json(
        { error: 'ID catalogo non valido' },
        { status: 400 }
      )
    }

    console.log('Recupero file per catalogo ID:', catalogoId)

    const { rows: files } = await db.query(`
      SELECT 
        id,
        nome as filename,
        file_url,
        tipo as file_type,
        description,
        created_at
      FROM catalogo_files
      WHERE catalogo_id = $1
      ORDER BY created_at DESC
    `, [catalogoId])

    return NextResponse.json(files)
  } catch (error) {
    console.error('Errore nel recupero dei file:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei file' },
      { status: 500 }
    )
  }
}
