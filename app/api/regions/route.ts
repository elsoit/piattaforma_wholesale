import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country')

  if (!country) {
    return NextResponse.json({ error: 'Country is required' }, { status: 400 })
  }

  const dbClient = await db.connect()

  try {
    const { rows } = await dbClient.query(
      'SELECT id, name FROM regions WHERE country_code = $1 ORDER BY name',
      [country]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  } finally {
    dbClient.release()
  }
} 