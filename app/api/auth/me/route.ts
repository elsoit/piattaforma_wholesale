import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

    export async function GET() {
        try {
          const cookieStore = await cookies()
          const sessionId = cookieStore.get('session')?.value
          const clientId = cookieStore.get('client_id')?.value
      
          if (!sessionId || !clientId) {
            console.log('Sessione o client_id mancante')
            return NextResponse.json(
              { error: 'Non autorizzato' },
              { status: 401 }
            )
          }
      
          // Verifica che il client_id appartenga all'utente loggato
          const { rows: [client] } = await db.query(`
            SELECT c.id 
            FROM clients c
            WHERE c.id = $1 AND c.user_id = $2
          `, [clientId, sessionId])
      
          if (!client) {
            console.log('Cliente non autorizzato')
            return NextResponse.json(
              { error: 'Non autorizzato' },
              { status: 401 }
            )
          }
      
          // Recupera i brand associati al cliente
          const { rows: brands } = await db.query(`
            SELECT DISTINCT b.id, b.name, b.description, b.logo
            FROM brands b
            INNER JOIN client_brands cb ON b.id = cb.brand_id
            WHERE cb.client_id = $1
            ORDER BY b.name
          `, [clientId])
      
          console.log(`Trovati ${brands.length} brand per il cliente ${clientId}`)
          return NextResponse.json(brands)
      
        } catch (error) {
          console.error('Errore nel recupero dei brand:', error)
          return NextResponse.json(
            { error: 'Errore nel recupero dei brand' },
            { status: 500 }
          )
        }
      }
