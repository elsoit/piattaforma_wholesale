import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Config, BUCKET_NAME } from './r2-config'

const R2 = new S3Client(r2Config)

export interface FileDownloadResult {
  buffer: ArrayBuffer;
  contentType: string;
}

export async function downloadFileFromR2(key: string): Promise<FileDownloadResult> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const signedUrl = await getSignedUrl(R2, command, { expiresIn: 300 })
  const response = await fetch(signedUrl)

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  return { buffer, contentType }
}

export async function getSignedFileUrl(key: string, filename: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  })

  return getSignedUrl(R2, command, { expiresIn: 3600 })
} 