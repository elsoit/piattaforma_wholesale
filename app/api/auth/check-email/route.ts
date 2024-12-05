import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkEmailSchema } from '@/types/auth'
import { createSuccessResponse, createErrorResponse } from '@/types/api'

export async function POST(request: Request) {
  try {
    // Valida il body della richiesta
    const body = await request.json()
    const { email } = checkEmailSchema.parse(body)

    // Controlla se l'email esiste già
    const { rows } = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE LOWER(email) = LOWER($1)
      ) as exists`,
      [email]
    )

    const exists = rows[0]?.exists || false

    if (exists) {
      return NextResponse.json(
        createErrorResponse('Email già registrata'),
        { status: 400 }
      )
    }

    return NextResponse.json(
      createSuccessResponse({ available: true })
    )

  } catch (error) {
    console.error('Errore nel controllo email:', error)
    
    // Se l'errore è di validazione, restituisci un errore 400
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse('Email non valida'),
        { status: 400 }
      )
    }

    // Altrimenti restituisci un errore 500
    return NextResponse.json(
      createErrorResponse('Errore nel controllo email'),
      { status: 500 }
    )
  }
}

// Opzionale: gestisci le richieste OPTIONS per CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 