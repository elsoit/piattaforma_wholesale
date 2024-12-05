import { S3Client } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://a8e3ac15a95a1b6a6bd0e51aadb0d9b6.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  }
});

export const R2_ENDPOINT = 'ancient-moon-a771.steep-firefly-f7f0.workers.dev';
export const R2_BUCKET = 'piattaforma-whls'; 