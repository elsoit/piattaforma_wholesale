import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  console.log('Plain password:', plainPassword)
  console.log('Hashed password from DB:', hashedPassword)
  const result = await bcrypt.compare(plainPassword, hashedPassword)
  console.log('Password match result:', result)
  return result
}

export async function getClientId(): Promise<string | null> {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('session')?.value
  const clientId = cookieStore.get('client_id')?.value

  if (!sessionId || !clientId) {
    return null
  }

  // Verifica che il client_id appartenga all'utente loggato
  const { rows: [client] } = await db.query(`
    SELECT c.id 
    FROM clients c
    WHERE c.id = $1 AND c.user_id = $2
  `, [clientId, sessionId])

  return client ? clientId : null
} 