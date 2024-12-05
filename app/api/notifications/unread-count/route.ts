import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    const userId = sessionCookie?.value

    if (!userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const userIdInt = parseInt(userId)
    if (isNaN(userIdInt)) {
      return NextResponse.json({ error: 'ID utente non valido' }, { status: 400 })
    }

    const { rows: [{ count }] } = await db.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1
      AND read = false
    `, [userIdInt])

    return NextResponse.json({ count: parseInt(count) })

  } catch (error) {
    console.error('Errore nel conteggio delle notifiche non lette:', error)
    return NextResponse.json(
      { error: 'Errore nel conteggio delle notifiche non lette' },
      { status: 500 }
    )
  }
} 