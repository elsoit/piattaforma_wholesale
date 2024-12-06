import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { z } from 'zod'

const requestSchema = z.object({
  brandId: z.string()
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const clientId = cookieStore.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { brandId } = requestSchema.parse(body)

    // Verifica se esiste già un interesse
    const { rows: [existing] } = await db.query(
      `SELECT id FROM client_brand_interests 
       WHERE client_id = $1 AND brand_id = $2`,
      [clientId, brandId]
    )

    if (existing) {
      return NextResponse.json(
        { error: 'Interesse già registrato' },
        { status: 400 }
      )
    }

    // Inserisci il nuovo interesse
    await db.query(
      `INSERT INTO client_brand_interests (client_id, brand_id)
       VALUES ($1, $2)`,
      [clientId, brandId]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Errore nella registrazione dell\'interesse:', error)
    return NextResponse.json(
      { error: 'Errore nella registrazione dell\'interesse' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const clientId = cookieStore.get('client_id')?.value

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { rows } = await db.query(
      `SELECT * FROM client_brand_interests 
       WHERE client_id = $1`,
      [clientId]
    )

    return NextResponse.json({ data: rows })

  } catch (error) {
    console.error('Errore nel recupero degli interessi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli interessi' },
      { status: 500 }
    )
  }
} 