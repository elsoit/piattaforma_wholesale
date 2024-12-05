import { NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'sayedalorabi@hotmail.com'
    
    await sendVerificationEmail(
      email,
      'Utente Test',
      'test-token-123'
    )

    return NextResponse.json({
      success: true,
      message: `Email di test inviata con successo a ${email}`
    })
  } catch (error) {
    console.error('Errore invio email:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore nell\'invio dell\'email',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 })
  }
} 