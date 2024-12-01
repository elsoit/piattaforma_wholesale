import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = 'piattaforma-whls';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const key = `${timestamp}-${randomId}-${originalName}`;

    // Converti il file in buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload diretto usando S3Client
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await R2.send(command);

    // Rimuoviamo qualsiasi protocollo dall'URL pubblico e assicuriamoci che non ci siano doppi slash
    const baseUrl = process.env.R2_PUBLIC_URL || '';
    const cleanBaseUrl = baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const fileUrl = `https://${cleanBaseUrl}/${key}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      key: key,
      filename: originalName,
      contentType: file.type
    });

  } catch (error) {
    console.error('Errore upload:', error);
    return NextResponse.json(
      { error: 'Errore nel processo di upload', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
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
  );
} 