import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const id = searchParams.get('id')

    if (!email) {
      return NextResponse.json(
        { error: 'Email non fornita' },
        { status: 400 }
      )
    }

    const query = `
      SELECT EXISTS(
        SELECT 1 FROM clients 
        WHERE company_email = $1 
        AND id != $2
      ) as exists
    `
    
    const result = await db.query(query, [email, id])
    
    return NextResponse.json({ exists: result.rows[0].exists })
  } catch (error) {
    console.error('Errore check email:', error)
    return NextResponse.json(
      { error: 'Errore durante la verifica dell\'email' },
      { status: 500 }
    )
  }
} 