import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    // @ts-ignore - Next.js types are not up to date
    const server = req.socket.server as NetServer & {
      io?: SocketIOServer
    }

    if (!server) {
      console.error('❌ Server HTTP non disponibile')
      return new NextResponse('Server non disponibile', { status: 500 })
    }

    if (!server.io) {
      console.log('🔌 Inizializzazione nuovo server Socket.IO')

      const io = new SocketIOServer(server, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : 'http://localhost:3000',
          methods: ['GET', 'POST'],
          credentials: true,
          allowedHeaders: ['Content-Type', 'Authorization']
        },
        transports: ['websocket'],
        pingTimeout: 30000,
        pingInterval: 10000,
        connectTimeout: 30000,
        maxHttpBufferSize: 1e6,
        allowEIO3: true,
        cookie: {
          name: 'io',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        }
      })

      server.io = io

      io.on('connection', (socket) => {
        console.log('✅ Client connesso:', socket.id)

        socket.on('authenticate', (userId: string) => {
          if (!userId) {
            console.error('❌ Tentativo di autenticazione senza userId')
            socket.emit('error', { message: 'UserId richiesto per l\'autenticazione' })
            return
          }
          
          try {
            const room = `user-${userId}`
            socket.join(room)
            console.log(`👤 Utente ${userId} autenticato e aggiunto alla stanza ${room}`)
            socket.emit('authenticated', { userId, room })
          } catch (error) {
            console.error('❌ Errore durante l\'autenticazione:', error)
            socket.emit('error', { message: 'Errore durante l\'autenticazione' })
          }
        })

        socket.on('error', (error) => {
          console.error('❌ Errore socket:', error)
        })

        socket.on('disconnect', (reason) => {
          console.log(`❌ Client disconnesso (${reason}):`, socket.id)
        })

        // Gestione ping/pong personalizzata
        socket.conn.on('packet', (packet) => {
          if (packet.type === 'ping') {
            console.log('📡 Ping ricevuto da:', socket.id)
          }
        })
      })
    }

    return new NextResponse('Socket server disponibile', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione del socket:', error)
    return new NextResponse('Errore nell\'inizializzazione del socket', { status: 500 })
  }
} 