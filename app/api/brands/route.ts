import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// Funzione di utilità per normalizzare il nome
function normalizeName(name: string): string {
  return name.trim().toUpperCase()
}

// Funzione per verificare duplicati
async function checkDuplicateName(normalizedName: string, excludeId?: string): Promise<boolean> {
  try {
    const query = excludeId
      ? 'SELECT id FROM brands WHERE UPPER(TRIM(name)) = $1 AND id != $2'
      : 'SELECT id FROM brands WHERE UPPER(TRIM(name)) = $1'
    
    const params = excludeId ? [normalizedName, excludeId] : [normalizedName]
    
    const { rows } = await db.query(query, params)
    return rows.length > 0
  } catch (error) {
    console.error('Errore nel controllo duplicati:', error)
    throw error
  }
}

export async function GET() {
  try {
    const brands = await db.query('SELECT * FROM brands ORDER BY name')
    return NextResponse.json({ data: brands.rows })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const normalizedName = normalizeName(data.name)
    
    // Verifica duplicati
    const isDuplicate = await checkDuplicateName(normalizedName)
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Esiste già un brand con questo nome' },
        { status: 400 }
      )
    }

    const id = uuidv4()
    const { rows } = await db.query(
      `INSERT INTO brands (id, name, description, logo) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [id, normalizedName, data.description, data.logo]
    )

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Errore nella creazione del brand:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del brand' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const normalizedName = normalizeName(data.name)
    
    // Verifica duplicati escludendo il brand corrente
    const isDuplicate = await checkDuplicateName(normalizedName, data.id)
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Esiste già un brand con questo nome' },
        { status: 400 }
      )
    }
    
    const { rows } = await db.query(
      `UPDATE brands 
       SET name = $1, description = $2, logo = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [normalizedName, data.description, data.logo, data.id]
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

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json(
        { error: 'ID non fornito' },
        { status: 400 }
      )
    }

    const { rows } = await db.query(
      'DELETE FROM brands WHERE id = $1 RETURNING *',
      [id]
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