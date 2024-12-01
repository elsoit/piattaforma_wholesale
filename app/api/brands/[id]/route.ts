import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Funzione di utilità per normalizzare il nome
function normalizeName(name: string): string {
  return name.trim().toUpperCase()
}

// Funzione per verificare duplicati
async function checkDuplicateName(normalizedName: string, excludeId: string): Promise<boolean> {
  const { rows } = await db.query(
    'SELECT id FROM brands WHERE UPPER(TRIM(name)) = $1 AND id != $2',
    [normalizedName, excludeId]
  )
  return rows.length > 0
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const normalizedName = normalizeName(data.name)
    
    // Verifica duplicati escludendo il brand corrente
    const isDuplicate = await checkDuplicateName(normalizedName, params.id)
    if (isDuplicate) {
      return NextResponse.json(
        { error: `Il brand "${data.name}" esiste già` },
        { status: 400 }
      )
    }
    
    const { rows } = await db.query(
      `UPDATE brands 
       SET name = $1, 
           description = $2, 
           logo = $3, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [normalizedName, data.description, data.logo, params.id]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Errore nell\'aggiornamento del brand:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del brand' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rows } = await db.query(
      'DELETE FROM brands WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore nella cancellazione del brand:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione del brand' },
      { status: 500 }
    )
  }
}