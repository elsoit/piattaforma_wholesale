import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface FileUpdateData {
  nome: string;
  description?: string;
  tipo?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; filesid: string } }
) {
  try {
    const { id, filesid } = params
    const data = await request.json() as FileUpdateData
    console.log('Dati ricevuti:', id, filesid, data)
    
    // Verifica che tutti i campi necessari siano presenti
    const { nome, description, tipo } = data

    if (!nome) {
      return NextResponse.json(
        { 
          error: 'Dati mancanti',
          details: 'Il nome è un campo obbligatorio'
        },
        { status: 400 }
      )
    }

    console.log('Dati ricevuti:', {
      catalogoId: id,
      fileId: filesid,
      nome,
      description,
      tipo
    })

    // Verifica che il file esista e appartenga al catalogo
    const existingFile = await db.query(
      `SELECT id FROM catalogo_files 
       WHERE id = $1 AND catalogo_id = $2`,
      [filesid, id]
    )

    if (existingFile.rows.length === 0) {
      return NextResponse.json(
        { error: 'File non trovato' },
        { status: 404 }
      )
    }

    // Aggiorna il file
    const result = await db.query(
      `UPDATE catalogo_files 
       SET nome = $1, 
           description = $2, 
           tipo = COALESCE($3, tipo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND catalogo_id = $5
       RETURNING *`,
      [
        nome,
        description || null,
        tipo || null,
        filesid,
        id
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Errore aggiornamento file:', error)
    return NextResponse.json(
      { 
        error: 'Errore nell\'aggiornamento del file',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; filesid: string } }
) {
  try {
    const { id: catalogoId, filesid: fileId } = params
    
    // Recupera info file
    const { rows: [file] } = await db.query(
      'SELECT file_url FROM catalogo_files WHERE id = $1 AND catalogo_id = $2',
      [fileId, catalogoId]
    )

    if (!file) {
      return NextResponse.json(
        { error: 'File non trovato' },
        { status: 404 }
      )
    }

    // Elimina il record dal database
    await db.query(
      'DELETE FROM catalogo_files WHERE id = $1',
      [fileId]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Errore nell\'eliminazione del file:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del file' },
      { status: 500 }
    )
  }
}