import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

export type ServerWithIO = NetServer & {
  io?: SocketIOServer
}

export function getIO(server: ServerWithIO): SocketIOServer | null {
  if (!server?.io) {
    console.error('❌ Socket.IO non inizializzato')
    return null
  }
  return server.io
} 