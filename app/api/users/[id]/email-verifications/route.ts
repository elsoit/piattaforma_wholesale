import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse } from '@/types/api'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id

  try {
    const result = await db.query(`
      SELECT 
        id,
        status,
        created_at,
        verified_at,
        expires_at,
        ip_address,
        user_agent
      FROM email_verifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId])

    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Errore nel recupero delle verifiche:', err)
    return NextResponse.json(
      createErrorResponse('Errore nel recupero delle verifiche'),
      { status: 500 }
    )
  }
} 