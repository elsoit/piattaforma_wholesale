import { S3Client } from '@aws-sdk/client-s3'

// Environment variables required for R2 configuration
const {
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env

if (!R2_ENDPOINT) {
  throw new Error('Missing environment variable: R2_ENDPOINT')
}

if (!R2_ACCESS_KEY_ID) {
  throw new Error('Missing environment variable: R2_ACCESS_KEY_ID')
}

if (!R2_SECRET_ACCESS_KEY) {
  throw new Error('Missing environment variable: R2_SECRET_ACCESS_KEY')
}

if (!R2_BUCKET) {
  throw new Error('Missing environment variable: R2_BUCKET')
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export { R2_ENDPOINT, R2_BUCKET }
