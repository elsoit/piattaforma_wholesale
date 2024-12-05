import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/types/api'
import { R2, BUCKET_NAME } from '@/lib/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { z } from 'zod'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, fileId: string } }
) {
  try {
    const { id: catalogoId, fileId } = params

    // Recupera info file
    const fileResult = await db.query(
      'SELECT file_url FROM catalogo_files WHERE id = $1 AND catalogo_id = $2',
      [fileId, catalogoId]
    )

    if (!fileResult.rows.length) {
      return NextResponse.json(
        createErrorResponse('File non trovato'),
        { status: 404 }
      )
    }

    // Inizia una transazione
    await db.query('BEGIN')

    try {
      // Elimina il file da R2
      const key = fileResult.rows[0].file_url
      await R2.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }))

      // Elimina il record dal database
      await db.query(
        'DELETE FROM catalogo_files WHERE id = $1',
        [fileId]
      )

      await db.query('COMMIT')

      return NextResponse.json(
        createSuccessResponse({ deleted: true })
      )

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Errore nella cancellazione del file:', error)
    return NextResponse.json(
      createErrorResponse('Errore nella cancellazione del file'),
      { status: 500 }
    )
  }
}

// PUT: Aggiorna i metadati del file
export async function PUT(
  request: Request,
  { params }: { params: { id: string, fileId: string } }
) {
  try {
    const { id: catalogoId, fileId } = params
    const body = await request.json()

    // Valida i dati
    const updateSchema = z.object({
      nome: z.string().optional(),
      description: z.string().optional()
    })

    const data = updateSchema.parse(body)
    const updates = Object.entries(data).filter(([_, value]) => value !== undefined)

    if (updates.length === 0) {
      return NextResponse.json(
        createErrorResponse('Nessun dato da aggiornare'),
        { status: 400 }
      )
    }

    // Costruisci la query di update
    const setClause = updates.map(([key], i) => `${key} = $${i + 3}`).join(', ')
    const values = updates.map(([_, value]) => value)

    const result = await db.query(
      `UPDATE catalogo_files 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND catalogo_id = $2 
       RETURNING *`,
      [fileId, catalogoId, ...values]
    )

    if (!result.rows.length) {
      return NextResponse.json(
        createErrorResponse('File non trovato'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse(result.rows[0])
    )

  } catch (error) {
    console.error('Errore nell\'aggiornamento del file:', error)
    return NextResponse.json(
      createErrorResponse('Errore nell\'aggiornamento del file'),
      { status: 500 }
    )
  }
} 