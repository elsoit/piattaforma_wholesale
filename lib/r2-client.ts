import { S3Client } from '@aws-sdk/client-s3'

// Verifica che le variabili d'ambiente necessarie siano definite
if (!process.env.R2_ACCOUNT_ID) throw new Error('R2_ACCOUNT_ID non definito')
if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID non definito')
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY non definito')

export const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
})

// Costanti per R2
export const BUCKET_NAME = 'piattaforma-whls'

// Helper per i tipi di file comuni
export const CONTENT_TYPES = {
  'pdf': 'application/pdf',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'zip': 'application/zip',
} as const

export type ContentType = keyof typeof CONTENT_TYPES

// Helper per determinare il content type
export function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() as ContentType | undefined
  return ext ? CONTENT_TYPES[ext] || 'application/octet-stream' : 'application/octet-stream'
}

// Helper per generare un nome file unico
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = originalName.split('.').pop()
  return `${timestamp}-${random}.${ext}`
}

// Helper per validare il tipo di file
export function isAllowedFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  return ext ? Object.keys(CONTENT_TYPES).includes(ext) : false
} 