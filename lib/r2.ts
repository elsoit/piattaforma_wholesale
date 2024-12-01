import { S3Client } from '@aws-sdk/client-s3'
import { config } from '@/config/environment'

export const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
  forcePathStyle: true,
})

export const BUCKET_NAME = config.r2.bucket 