import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Query per ottenere i valori dell'enum product_status
    const { rows: statuses } = await db.query(`
      SELECT enum_range(NULL::product_status)
    `)

    // Converte l'array di enum in un formato più utilizzabile
    const statusValues = statuses[0].enum_range
      .replace(/[{"}]/g, '')
      .split(',')

    return NextResponse.json(statusValues)
  } catch (error) {
    console.error('Errore nel recupero degli stati:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli stati' },
      { status: 500 }
    )
  }
} 