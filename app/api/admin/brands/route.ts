import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { rows: brands } = await db.query(`
      SELECT id, name 
      FROM brands 
      ORDER BY name ASC
    `)

    return NextResponse.json(brands)
  } catch (error) {
    console.error('Errore nel recupero dei brand:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
} 