import { R2, BUCKET_NAME } from './r2-client'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import JSZip from 'jszip'
import { db } from './db'

interface FileInfo {
  nome: string
  file_url: string
}

interface CatalogoInfo {
  brand_name: string
  stagione: string
  anno: number
  tipo: string
  nome: string | null
}

export async function downloadAndZipFiles(catalogoId: string): Promise<{ 
  zipContent: ArrayBuffer, 
  filename: string 
}> {
  // Recupera info catalogo
  const catalogoResult = await db.query<CatalogoInfo>(`
    SELECT c.*, b.name as brand_name 
    FROM cataloghi c 
    JOIN brands b ON c.brand_id = b.id 
    WHERE c.id = $1`,
    [catalogoId]
  )

  if (!catalogoResult.rows.length) {
    throw new Error('Catalogo non trovato')
  }

  const catalogo = catalogoResult.rows[0]

  // Recupera file
  const filesResult = await db.query<FileInfo>(
    'SELECT nome, file_url FROM catalogo_files WHERE catalogo_id = $1',
    [catalogoId]
  )

  if (!filesResult.rows.length) {
    throw new Error('Nessun file trovato')
  }

  const zip = new JSZip()
  
  // Download e compressione file
  const downloadPromises = filesResult.rows.map(async (file) => {
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

      // Converti il buffer in Uint8Array che JSZip può gestire
      const arrayBuffer = await response.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      zip.file(file.nome, uint8Array, {
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
    throw new Error('Nessun file aggiunto allo ZIP')
  }

  const zipContent = await zip.generateAsync({ 
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  const filename = `${catalogo.brand_name}-${catalogo.stagione}-${catalogo.anno}-${catalogo.tipo}-${catalogo.nome || 'catalogo'}.zip`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_.]/g, '')

  return { zipContent, filename }
}

// Helper per gestire i file singoli
export async function getFileDownloadUrl(fileId: string): Promise<{
  url: string
  filename: string
}> {
  const result = await db.query<FileInfo>(
    'SELECT nome, file_url FROM catalogo_files WHERE id = $1',
    [fileId]
  )

  if (!result.rows.length) {
    throw new Error('File non trovato')
  }

  const file = result.rows[0]
  const key = file.file_url.split('/').pop()

  if (!key) {
    throw new Error('URL file non valido')
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${file.nome}"`,
  })

  const url = await getSignedUrl(R2, command, { expiresIn: 300 })

  return {
    url,
    filename: file.nome
  }
} 