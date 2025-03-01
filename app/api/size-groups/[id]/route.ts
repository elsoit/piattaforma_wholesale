import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const putSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sizes: z.array(z.number())
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

    const { name, description, sizes } = result.data

    // Inizia una transazione
    await db.query('BEGIN')

    try {
      // Aggiorna il gruppo
      await db.query(
        'UPDATE size_groups SET name = $1, description = $2 WHERE id = $3',
        [name, description, id]
      )

      // Rimuovi tutte le associazioni esistenti
      await db.query(
        'DELETE FROM size_group_sizes WHERE size_group_id = $1',
        [id]
      )

      // Inserisci le nuove associazioni
      if (sizes && sizes.length > 0) {
        const values = sizes.map((sizeId) => 
          `(${id}, ${sizeId})`
        ).join(', ')

        await db.query(`
          INSERT INTO size_group_sizes (size_group_id, size_id)
          VALUES ${values}
        `)
      }

      await db.query('COMMIT')

      // Recupera il gruppo aggiornato con le taglie
      const { rows: [groupWithSizes] } = await db.query(`
        SELECT 
          sg.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', s.id,
                'name', s.name
              )
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) as sizes
        FROM size_groups sg
        LEFT JOIN size_group_sizes sgs ON sg.id = sgs.size_group_id
        LEFT JOIN sizes s ON sgs.size_id = s.id
        WHERE sg.id = $1
        GROUP BY sg.id
      `, [id])

      return NextResponse.json(groupWithSizes)
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento del gruppo taglie:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del gruppo taglie' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    // Ottieni il gruppo taglie con le sue taglie associate
    const { rows: [sizeGroup] } = await db.query(`
      SELECT 
        sg.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as sizes
      FROM size_groups sg
      LEFT JOIN size_group_sizes sgs ON sg.id = sgs.size_group_id
      LEFT JOIN sizes s ON sgs.size_id = s.id
      WHERE sg.id = $1
      GROUP BY sg.id
    `, [id])

    if (!sizeGroup) {
      return NextResponse.json(
        { error: 'Gruppo taglie non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(sizeGroup)
  } catch (error) {
    console.error('Errore nel recupero del gruppo taglie:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del gruppo taglie' },
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
    
    // Inizia una transazione
    await db.query('BEGIN')

    try {
      // Elimina prima tutte le associazioni
      await db.query(
        'DELETE FROM size_group_sizes WHERE size_group_id = $1',
        [id]
      )

      // Poi elimina il gruppo
      const { rows: [group] } = await db.query(
        'DELETE FROM size_groups WHERE id = $1 RETURNING *',
        [id]
      )

      if (!group) {
        await db.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Gruppo taglie non trovato' },
          { status: 404 }
        )
      }

      await db.query('COMMIT')
      return NextResponse.json(group)
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nella cancellazione del gruppo taglie:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione del gruppo taglie' },
      { status: 500 }
    )
  }
} 