import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/types/api'
import { R2, BUCKET_NAME, isAllowedFileType, generateUniqueFileName } from '@/lib/r2-client'
import { PutObjectCommand } from '@aws-sdk/client-s3'

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


export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const catalogoId = await params.id
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        createErrorResponse('File mancante'),
        { status: 400 }
      )
    }

    // Valida il tipo di file
    if (!isAllowedFileType(file.name)) {
      return NextResponse.json(
        createErrorResponse('Tipo di file non supportato'),
        { status: 400 }
      )
    }

    // Genera un nome file univoco
    const fileName = generateUniqueFileName(file.name)
    
    // Carica il file su R2
    const buffer = await file.arrayBuffer()
    await R2.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(buffer),
      ContentType: file.type
    }))

    // Salva il riferimento nel database
    const result = await db.query(
      `INSERT INTO catalogo_files (
        catalogo_id, nome, tipo, file_url, description
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        catalogoId,
        file.name,
        file.type,
        fileName,
        formData.get('description')
      ]
    )

    return NextResponse.json(
      createSuccessResponse(result.rows[0]),
      { status: 201 }
    )

  } catch (error) {
    console.error('Errore nel caricamento del file:', error)
    return NextResponse.json(
      createErrorResponse('Errore nel caricamento del file'),
      { status: 500 }
    )
  }
}
