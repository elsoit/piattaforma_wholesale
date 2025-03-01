import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const putSchema = z.object({
  name: z.string().min(1)
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const result = putSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dati non validi' },
        { status: 400 }
      )
    }

    const normalizedName = result.data.name.trim().toLowerCase().replace(/\s+/g, '')

    // Verifica se il nuovo nome esiste già per un'altra taglia
    const { rows: existing } = await db.query(
      'SELECT id FROM sizes WHERE LOWER(REPLACE(name, \' \', \'\')) = $1 AND id != $2',
      [normalizedName, id]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `La taglia "${result.data.name.trim().toUpperCase()}" esiste già` },
        { status: 400 }
      )
    }

    const { rows: [size] } = await db.query(
      'UPDATE sizes SET name = $1 WHERE id = $2 RETURNING *',
      [result.data.name.trim().toUpperCase(), id]
    )

    if (!size) {
      return NextResponse.json(
        { error: 'Taglia non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json(size)
  } catch (error) {
    console.error('Errore nell\'aggiornamento della taglia:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della taglia' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Verifica se la taglia è utilizzata in qualche gruppo
    const { rows: usedInGroups } = await db.query(
      'SELECT COUNT(*) as count FROM size_group_sizes WHERE size_id = $1',
      [id]
    )

    if (usedInGroups[0].count > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare la taglia perché è utilizzata in uno o più gruppi' },
        { status: 400 }
      )
    }

    const { rows: [size] } = await db.query(
      'DELETE FROM sizes WHERE id = $1 RETURNING *',
      [id]
    )

    if (!size) {
      return NextResponse.json(
        { error: 'Taglia non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json(size)
  } catch (error) {
    console.error('Errore nella cancellazione della taglia:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione della taglia' },
      { status: 500 }
    )
  }
} 