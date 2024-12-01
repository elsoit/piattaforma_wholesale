import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { db } from '@/lib/db'
import { downloadFileFromR2 } from '@/lib/r2-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catalogoId = await params.id

    const catalogoInfo = await db.query(
      `SELECT c.*, b.name as brand_name 
       FROM cataloghi c 
       JOIN brands b ON c.brand_id = b.id 
       WHERE c.id = $1`,
      [catalogoId]
    )

    if (!catalogoInfo.rows.length) {
      return NextResponse.json({ error: 'Catalogo non trovato' }, { status: 404 })
    }

    const catalogo = catalogoInfo.rows[0]
    
    const result = await db.query(
      'SELECT nome, file_url FROM catalogo_files WHERE catalogo_id = $1',
      [catalogoId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Nessun file trovato' }, { status: 404 })
    }

    const zip = new JSZip()
    
    const downloadPromises = result.rows.map(async (file) => {
      try {
        const key = file.file_url.split('/').pop()
        if (!key) return false

        const { buffer } = await downloadFileFromR2(key)
        
        zip.file(file.nome, buffer, {
          binary: true,
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        })
        
        return true
      } catch (err) {
        console.error('Errore nel processare il file:', err)
        return false
      }
    })

    const results = await Promise.all(downloadPromises)
    const filesAdded = results.filter(Boolean).length

    if (filesAdded === 0) {
      return NextResponse.json(
        { error: 'Nessun file aggiunto allo ZIP' }, 
        { status: 500 }
      )
    }

    const zipContent = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const zipFileName = `${catalogo.brand_name}-${catalogo.stagione}-${catalogo.anno}-${catalogo.tipo}-${catalogo.nome || 'catalogo'}.zip`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_.]/g, '')

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
      }
    })

  } catch (error) {
    console.error('Errore nel download dei file:', error)
    return NextResponse.json(
      { error: 'Errore nel download dei file' }, 
      { status: 500 }
    )
  }
}