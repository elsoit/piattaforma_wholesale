import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Prima recupera il file per ottenere il path
    const { rows: [file] } = await db.query(`
      SELECT * FROM catalogo_files WHERE id = $1
    `, [params.id])

    if (!file) {
      return NextResponse.json(
        { error: 'File non trovato' },
        { status: 404 }
      )
    }

    // Elimina il file fisico
    try {
      const filePath = join(process.cwd(), 'public', file.file_url)
      await unlink(filePath)
    } catch (err) {
      console.error('Errore nell\'eliminazione del file fisico:', err)
      // Continua anche se il file fisico non può essere eliminato
    }

    // Elimina il record dal database
    await db.query(`
      DELETE FROM catalogo_files WHERE id = $1
    `, [params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore nell\'eliminazione del file:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del file' },
      { status: 500 }
    )
  }
} 