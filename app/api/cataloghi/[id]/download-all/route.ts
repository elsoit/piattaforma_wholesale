import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import JSZip from 'jszip'
import { db } from '@/lib/db'

const BUCKET_NAME = 'piattaforma-whls'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

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

        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
        
        const signedUrl = await getSignedUrl(R2, command, { expiresIn: 300 })

        const response = await fetch(signedUrl)
        if (!response.ok) return false

        const buffer = await response.arrayBuffer()
        
        zip.file(file.nome, new Uint8Array(buffer), {
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

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(zipContent))
        controller.close()
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Transfer-Encoding': 'chunked'
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