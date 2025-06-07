import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getIO, ServerWithIO } from '@/lib/socket'

// Schema validazione per la creazione di notifiche
const createNotificationSchema = z.object({
  type: z.enum(['BRAND_ACTIVATION', 'CATALOG_ADDED', 'BRAND_EXPIRED', 'ORDER_STATUS', 'SYSTEM']),
  icon: z.string(),
  color: z.string(),
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  message: z.string(),
})

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('session')?.value

    console.log('📨 Richiesta notifiche:', {
      hasUserId: !!userId,
      userId,
      allCookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
    })

    if (!userId) {
      console.log('❌ Sessione non valida')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Converti userId in intero e verifica che sia valido
    const userIdInt = parseInt(userId)
    if (isNaN(userIdInt)) {
      console.log('❌ UserId non valido:', userId)
      return NextResponse.json({ error: 'ID utente non valido' }, { status: 400 })
    }

    // Prima verifichiamo se ci sono notifiche per questo utente
    const checkResult = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
      [userIdInt]
    )
    
    console.log('🔍 Verifica notifiche:', {
      userId: userIdInt,
      totalCount: parseInt(checkResult.rows[0].count)
    })

    // Query di debug per vedere tutte le notifiche senza paginazione
    const allNotificationsResult = await db.query(`
      SELECT 
        n.*,
        b.name as brand_name,
        b.logo as brand_logo
      FROM notifications n
      LEFT JOIN brands b ON n.brand_id = b.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
    `, [userIdInt])

    console.log('📊 Tutte le notifiche trovate:', {
      count: allNotificationsResult.rows.length,
      notifications: allNotificationsResult.rows
    })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    console.log('🔍 Query parametri:', { page, limit, offset, userId: userIdInt })

    // Ottieni notifiche con join su brands per ottenere logo e nome
    const notificationsResult = await db.query(`
      SELECT 
        n.id,
        n.type,
        n.icon,
        n.color,
        n.brand_id,
        COALESCE(n.brand_name, b.name) as brand_name,
        b.logo as brand_logo,
        n.message,
        n.read,
        n.created_at,
        n.read_at,
        n.user_id
      FROM notifications n
      LEFT JOIN brands b ON n.brand_id = b.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userIdInt, limit, offset])

    console.log('📊 Risultati query paginata:', {
      found: notificationsResult.rows.length,
      notifications: notificationsResult.rows.map(n => ({
        ...n,
        created_at: n.created_at.toISOString(),
        read_at: n.read_at ? n.read_at.toISOString() : null
      }))
    })

    // Ottieni conteggio totale per paginazione
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
      [userIdInt]
    )

    const total = parseInt(countResult.rows[0].count)

    console.log('📈 Statistiche:', {
      total,
      pages: Math.ceil(total / limit),
      current: page
    })

    // Formatta le date e trasforma i campi per il client
    const formattedNotifications = notificationsResult.rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      icon: notification.icon,
      color: notification.color,
      brandId: notification.brand_id,
      brandName: notification.brand_name,
      brandLogo: notification.brand_logo,
      message: notification.message,
      read: notification.read,
      createdAt: notification.created_at.toISOString(),
      readAt: notification.read_at ? notification.read_at.toISOString() : null
    }))

    const response = {
      notifications: formattedNotifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page
      }
    }

    console.log('✅ Risposta API:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Errore nel recupero delle notifiche:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Errore nel recupero delle notifiche' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('session')?.value

    console.log('📨 Creazione notifica:', {
      hasUserId: !!userId,
      userId,
      allCookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
    })

    if (!userId) {
      console.log('❌ Sessione non valida per la creazione')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()
    const validatedData = createNotificationSchema.parse(data)

    // Inserisci la notifica nel database
    const result = await db.query(`
      INSERT INTO notifications (
        user_id,
        type,
        icon,
        color,
        brand_id,
        brand_name,
        message,
        read,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP
      )
      RETURNING 
        id, type, icon, color, brand_id, brand_name,
        message, read, created_at, read_at
    `, [
      parseInt(userId),
      validatedData.type,
      validatedData.icon,
      validatedData.color,
      validatedData.brandId || null,
      validatedData.brandName || null,
      validatedData.message
    ])

    const notification = {
      ...result.rows[0],
      brandId: result.rows[0].brand_id,
      brandName: result.rows[0].brand_name,
      createdAt: result.rows[0].created_at.toISOString(),
      readAt: result.rows[0].read_at ? result.rows[0].read_at.toISOString() : null
    }
    
    try {
      const headersList = await headers()
      const host = headersList.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
      
      // Inizializza il socket con l'URL completo
      const socketResponse = await fetch(`${protocol}://${host}/api/socket`)
      if (!socketResponse.ok) {
        console.error('Errore nell\'inizializzazione del socket:', await socketResponse.text())
      }
      
      // @ts-ignore - Next.js types are not up to date
      const server = (request as any).socket?.server as ServerWithIO
      const io = getIO(server)
      
      if (io) {
        const room = `user-${userId}`
        console.log(`📨 Invio notifica alla stanza ${room}:`, notification)
        io.to(room).emit('notification', notification)
      } else {
        console.error('❌ Socket non inizializzato correttamente')
      }
    } catch (socketError) {
      console.error('Errore nell\'invio della notifica via socket:', socketError)
    }

    return NextResponse.json(notification)

  } catch (error) {
    console.error('Errore nella creazione della notifica:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Errore nella creazione della notifica' },
      { status: 500 }
    )
  }
} 