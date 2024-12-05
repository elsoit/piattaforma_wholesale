import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

const statusSchema = z.object({
  stato: z.enum(['bozza', 'pubblicato', 'archiviato'])
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const catalogoId = params.id
    const body = await request.json()
    const { stato } = statusSchema.parse(body)

    // Verifica che il catalogo esista
    const existing = await db.query(
      'SELECT stato FROM cataloghi WHERE id = $1',
      [catalogoId]
    )

    if (!existing.rows.length) {
      return NextResponse.json(
        createErrorResponse('Catalogo non trovato'),
        { status: 404 }
      )
    }

    // Verifica transizioni di stato valide
    const currentStato = existing.rows[0].stato
    if (!isValidStatusTransition(currentStato, stato)) {
      return NextResponse.json(
        createErrorResponse(`Transizione di stato non valida: da ${currentStato} a ${stato}`),
        { status: 400 }
      )
    }

    const result = await db.query(
      `UPDATE cataloghi 
       SET stato = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [stato, catalogoId]
    )

    return NextResponse.json(
      createSuccessResponse(result.rows[0])
    )

  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato:', error)
    return NextResponse.json(
      createErrorResponse('Errore nell\'aggiornamento dello stato'),
      { status: 500 }
    )
  }
}

// Helper per validare le transizioni di stato
function isValidStatusTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    'bozza': ['pubblicato', 'archiviato'],
    'pubblicato': ['archiviato'],
    'archiviato': []
  }

  return transitions[from]?.includes(to) || false
} 