import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const postSchema = z.object({
  name: z.string().min(1)
})

export async function GET() {
  try {
    const { rows } = await db.query(
      'SELECT * FROM sizes ORDER BY name ASC'
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Errore nel recupero delle taglie:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle taglie' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = postSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dati non validi' },
        { status: 400 }
      )
    }

    const normalizedName = result.data.name.trim().toLowerCase().replace(/\s+/g, '')

    // Verifica se la taglia esiste già (case insensitive e senza spazi)
    const { rows: existing } = await db.query(
      'SELECT id FROM sizes WHERE LOWER(REPLACE(name, \' \', \'\')) = $1',
      [normalizedName]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `La taglia "${result.data.name.trim().toUpperCase()}" esiste già` },
        { status: 400 }
      )
    }

    const { rows: [size] } = await db.query(
      'INSERT INTO sizes (name) VALUES ($1) RETURNING *',
      [result.data.name.trim().toUpperCase()]
    )

    return NextResponse.json(size)
  } catch (error) {
    console.error('Errore nella creazione della taglia:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della taglia' },
      { status: 500 }
    )
  }
} 