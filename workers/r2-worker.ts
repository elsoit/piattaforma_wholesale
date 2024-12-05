import { R2Bucket } from '@cloudflare/workers-types'
import { getContentType } from '@/lib/r2-client'

export interface Env {
  BUCKET: R2Bucket
  ALLOWED_ORIGINS: string[]
}

export default {
  async fetch(request: Request, env: Env) {
    // Gestione CORS
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env)
    }

    // Verifica origine
    if (!isAllowedOrigin(request, env)) {
      return new Response('Unauthorized', { status: 403 })
    }

    const url = new URL(request.url)
    const key = url.pathname.slice(1)

    try {
      switch (request.method) {
        case 'GET':
          return handleGet(key, env)
        case 'PUT':
          return handlePut(request, key, env)
        case 'DELETE':
          return handleDelete(key, env)
        default:
          return new Response('Method not allowed', { status: 405 })
      }
    } catch (error) {
      console.error(`Error handling ${request.method} for ${key}:`, error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}

async function handleGet(key: string, env: Env): Promise<Response> {
  const object = await env.BUCKET.get(key)
  
  if (!object) {
    return new Response('Object Not Found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000') // 1 anno
  headers.set('Content-Type', getContentType(key))

  return new Response(object.body, { headers })
}

async function handlePut(request: Request, key: string, env: Env): Promise<Response> {
  const contentType = request.headers.get('content-type') || getContentType(key)

  const obj = await env.BUCKET.put(key, request.body, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000'
    }
  })

  return Response.json({
    key: obj.key,
    size: obj.size,
    etag: obj.httpEtag,
    url: `https://${request.headers.get('host')}/${key}`
  })
}

async function handleDelete(key: string, env: Env): Promise<Response> {
  await env.BUCKET.delete(key)
  return new Response(null, { status: 204 })
}

function handleCORS(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin')
  
  if (!origin || !isAllowedOrigin(request, env)) {
    return new Response(null, { status: 403 })
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return false
  return env.ALLOWED_ORIGINS.includes(origin)
}

// Costanti esportate
export const WORKER_ENDPOINT = 'https://storage.your-domain.com'
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://your-domain.com'
]