import { S3Client } from '@aws-sdk/client-s3'
import { config } from '@/config/environment'

export interface Env {
  R2: R2Bucket
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url)
      const key = url.pathname.slice(1)

      if (!key) {
        return new Response('Key is required', { status: 400 })
      }

      const object = await env.R2.get(key)

      if (!object) {
        return new Response('Object Not Found', { status: 404 })
      }

      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)

      return new Response(object.body, {
        headers,
      })
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 })
    }
  },
}