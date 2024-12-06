import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description, logo 
       FROM brands 
       ORDER BY name ASC`
    )

    return NextResponse.json({ data: rows })

  } catch (error) {
    console.error('Errore nel recupero dei brand:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
} 