import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('session')?.value

    console.log('📝 Segnando come letta:', {
      notificationId: params.id,
      hasUserId: !!userId,
      userId,
      allCookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
    })

    if (!userId) {
      console.log('❌ Sessione non valida per la lettura')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const userIdInt = parseInt(userId)
    if (isNaN(userIdInt)) {
      console.log('❌ UserId non valido:', userId)
      return NextResponse.json({ error: 'ID utente non valido' }, { status: 400 })
    }

    const { rows: [notification] } = await db.query(`
      UPDATE notifications 
      SET 
        read = true,
        read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      AND user_id = $2
      RETURNING *
    `, [params.id, userIdInt])

    if (!notification) {
      console.log('❌ Notifica non trovata o non appartiene all\'utente')
      return NextResponse.json(
        { error: 'Notifica non trovata' },
        { status: 404 }
      )
    }

    console.log('✅ Notifica segnata come letta:', notification)
    return NextResponse.json(notification)

  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento della notifica:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della notifica' },
      { status: 500 }
    )
  }
} 