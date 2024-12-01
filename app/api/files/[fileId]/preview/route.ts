import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedFileUrl } from '@/lib/r2-helpers'

export async function POST(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = await params.fileId
    
    const result = await db.query(
      'SELECT nome, file_url FROM catalogo_files WHERE id = $1',
      [fileId]
    )

    if (!result.rows.length) {
      return NextResponse.json(
        { error: 'File non trovato' },
        { status: 404 }
      )
    }

    const file = result.rows[0]
    const key = file.file_url.split('/').pop()
    
    if (!key) {
      throw new Error('Impossibile determinare la chiave del file')
    }

    const previewUrl = await getSignedFileUrl(key, file.nome)

    return NextResponse.json({
      success: true,
      previewUrl,
      expiresIn: 3600,
      filename: file.nome
    })

  } catch (error) {
    console.error('Errore nella generazione dell\'anteprima:', error)
    return NextResponse.json(
      { 
        error: 'Errore nella generazione dell\'anteprima',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
} 