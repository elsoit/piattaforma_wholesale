import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface FileUpdateData {
  nome: string;
  description?: string;
  tipo?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; filesid: string } }
) {
  try {
    const data = await request.json() as FileUpdateData
    console.log('Dati ricevuti:', params.id, params.filesid, data)
    
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
      catalogoId: params.id,
      fileId: params.filesid,
      nome,
      description,
      tipo
    })

    // Verifica che il file esista e appartenga al catalogo
    const existingFile = await db.query(
      `SELECT id FROM catalogo_files 
       WHERE id = $1 AND catalogo_id = $2`,
      [params.filesid, params.id]
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
        params.filesid,
        params.id
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
  request: Request,
  { params }: { params: { id: string; filesid: string } }
) {
  try {
    // Verifica che il file esista e appartenga al catalogo
    const existingFile = await db.query(
      `SELECT * FROM catalogo_files 
       WHERE id = $1 AND catalogo_id = $2`,
      [params.filesid, params.id]
    )

    if (existingFile.rows.length === 0) {
      return NextResponse.json(
        { error: 'File non trovato' },
        { status: 404 }
      )
    }

    // Elimina il file
    await db.query(
      `DELETE FROM catalogo_files 
       WHERE id = $1 AND catalogo_id = $2`,
      [params.filesid, params.id]
    )

    return NextResponse.json({
      success: true,
      data: null
    })

  } catch (error) {
    console.error('Errore eliminazione file:', error)
    return NextResponse.json(
      { 
        error: 'Errore nell\'eliminazione del file',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}