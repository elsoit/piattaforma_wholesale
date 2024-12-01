import { R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    switch (request.method) {
      case 'PUT':
        const obj = await env.BUCKET.put(key, request.body);
        return Response.json({
          key: obj.key,
          url: `https://${url.hostname}/${key}`,
        });

      case 'GET':
        const object = await env.BUCKET.get(key);
        if (!object) return new Response('Object Not Found', { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
          headers,
        });
    }
  },
};

// Definisce l'endpoint del worker e il nome del bucket
export const R2_ENDPOINT = 'ancient-moon-a771.steep-firefly-f7f0.workers.dev';
export const R2_BUCKET = 'piattaforma-whls';