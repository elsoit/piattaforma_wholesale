import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const catalogoId = formData.get('catalogoId') as string
      
      if (!file || !catalogoId) {
        return NextResponse.json(
          { error: 'File e catalogoId sono richiesti' },
          { status: 400 }
        )
      }
  
      // Genera nome file univoco
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const hash = crypto.createHash('md5').update(buffer).digest('hex')
      const ext = file.name.split('.').pop()
      const filename = `${hash}.${ext}`
      
      // Salva il file
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      const filePath = join(uploadDir, filename)
      await writeFile(filePath, buffer)
      
      // Determina il tipo di file
      let tipo = 'document'
      if (file.type.startsWith('image/')) {
        tipo = 'image'
      }
  
      // Salva nel database
      const { rows: [catalogoFile] } = await db.query(`
        INSERT INTO catalogo_files (
          catalogo_id,
          nome,
          tipo,
          file_url,
          description
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        catalogoId,
        file.name,
        tipo,
        `/uploads/${filename}`,
        '' // description opzionale
      ])
  
      return NextResponse.json(catalogoFile)
    } catch (error) {
      console.error('Errore nel caricamento del file:', error)
      return NextResponse.json(
        { error: 'Errore nel caricamento del file' },
        { status: 500 }
      )
    }
  }

// Endpoint per ottenere i file di un catalogo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const catalogoId = searchParams.get('catalogoId')
    const type = searchParams.get('type') || 'all'

    if (!catalogoId) {
      return NextResponse.json(
        { error: 'CatalogoId richiesto' },
        { status: 400 }
      )
    }

    let query = `
      SELECT * FROM catalogo_files 
      WHERE catalogo_id = $1
    `

    if (type !== 'all') {
      query += ` AND tipo = $2`
    }

    query += ` ORDER BY created_at DESC`

    const { rows: files } = await db.query(
      query,
      type === 'all' ? [catalogoId] : [catalogoId, type]
    )

    return NextResponse.json(files)
  } catch (error) {
    console.error('Errore nel recupero dei file:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei file' },
      { status: 500 }
    )
  }
} 