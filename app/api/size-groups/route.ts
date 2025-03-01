import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const postSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sizes: z.array(z.number()) // Array di ID delle taglie
})

export async function GET() {
  try {
    // Recupera i gruppi con le loro taglie associate
    const { rows } = await db.query(`
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
      GROUP BY sg.id
      ORDER BY sg.name ASC
    `)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Errore nel recupero dei gruppi taglie:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei gruppi taglie' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = postSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dati non validi' },
        { status: 400 }
      )
    }

    const normalizedName = result.data.name.trim().toLowerCase().replace(/\s+/g, '')

    // Verifica se il gruppo esiste già (case insensitive e senza spazi)
    const { rows: existing } = await db.query(
      'SELECT id FROM size_groups WHERE LOWER(REPLACE(name, \' \', \'\')) = $1',
      [normalizedName]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Il gruppo taglie "${result.data.name.trim().toUpperCase()}" esiste già` },
        { status: 400 }
      )
    }

    const { name, description, sizes } = result.data

    // Inizia una transazione
    await db.query('BEGIN')

    try {
      // Inserisci il gruppo
      const { rows: [group] } = await db.query(
        'INSERT INTO size_groups (name, description) VALUES ($1, $2) RETURNING *',
        [name.trim().toUpperCase(), description]
      )

      // Inserisci le associazioni con le taglie
      if (sizes.length > 0) {
        const values = sizes.map((sizeId) => 
          `(${group.id}, ${sizeId})`
        ).join(', ')

        await db.query(`
          INSERT INTO size_group_sizes (size_group_id, size_id)
          VALUES ${values}
        `)
      }

      await db.query('COMMIT')

      // Recupera il gruppo con le taglie associate
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
      `, [group.id])

      return NextResponse.json(groupWithSizes)
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Errore nella creazione del gruppo taglie:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del gruppo taglie' },
      { status: 500 }
    )
  }
} 