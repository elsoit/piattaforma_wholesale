import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = 'piattaforma-whls'
const PREVIEW_EXPIRATION = 3600 // 1 ora in secondi

interface PreviewResponse {
  success: boolean;
  previewUrl: string;
  expiresIn: number;
  filename: string;
}

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

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `inline; filename="${file.nome}"`,
      ResponseContentType: getContentType(file.nome)
    })

    const previewUrl = await getSignedUrl(R2, command, { expiresIn: PREVIEW_EXPIRATION })

    const response: PreviewResponse = {
      success: true,
      previewUrl,
      expiresIn: PREVIEW_EXPIRATION,
      filename: file.nome
    }

    return NextResponse.json(response)

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

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const contentTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  
  return contentTypes[ext || ''] || 'application/octet-stream'
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