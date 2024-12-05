import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionId = searchParams.get('regionId')

  if (!regionId) {
    return NextResponse.json({ error: 'Region ID is required' }, { status: 400 })
  }

  const dbClient = await db.connect()

  try {
    const { rows } = await dbClient.query(
      'SELECT id, name FROM provinces WHERE region_id = $1 ORDER BY name',
      [regionId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
  } finally {
    dbClient.release()
  }
} 