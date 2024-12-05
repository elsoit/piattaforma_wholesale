import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import { db } from './db'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { rows: [user] } = await db.query(
          'SELECT * FROM users WHERE email = $1',
          [credentials.email]
        )

        if (!user) {
          return null
        }

        const isValid = await verifyPassword(credentials.password, user.password)
        
        if (!isValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.nome} ${user.cognome}`
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.email = token.email
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
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