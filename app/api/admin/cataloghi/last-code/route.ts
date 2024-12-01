import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { rows } = await db.query(`
      SELECT codice
      FROM cataloghi
      WHERE codice LIKE 'CATG%'
      ORDER BY codice DESC
      LIMIT 1
    `)

    const lastCode = rows[0]?.codice || 'CATG000000000'
    const numericPart = parseInt(lastCode.replace('CATG', ''))
    const nextCode = `CATG${String(numericPart + 1).padStart(9, '0')}`

    return NextResponse.json({ code: nextCode })
  } catch (error) {
    console.error('Errore nel recupero del codice:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del codice' },
      { status: 500 }
    )
  }
} 