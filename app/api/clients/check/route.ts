import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { company_name, country, vat_number } = await request.json()

    // Verifica combinazione di dati
    const result = await db.query(
      `SELECT id FROM clients 
       WHERE (company_name = $1 AND country = $2) 
          OR vat_number = $3`,
      [company_name, country, vat_number.toUpperCase()]
    )

    if (result.rows.length > 0) {
      return NextResponse.json(
        { error: 'Azienda già registrata con questi dati' },
        { status: 400 }
      )
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('Errore nel controllo azienda:', error)
    return NextResponse.json(
      { error: 'Errore nel controllo azienda' },
      { status: 500 }
    )
  }
} 