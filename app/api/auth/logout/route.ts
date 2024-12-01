import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Ottieni i cookie in modo asincrono
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('ruolo')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore logout:', error)
    return NextResponse.json(
      { error: 'Errore durante il logout' },
      { status: 500 }
    )
  }
} 