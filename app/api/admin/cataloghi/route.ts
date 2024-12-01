import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function generateCatalogoCode() {
  try {
    // Ottieni l'ultimo codice catalogo dal database
    const { rows: [lastCatalogo] } = await db.query(`
      SELECT codice 
      FROM cataloghi 
      ORDER BY created_at DESC 
      LIMIT 1
    `)

    if (!lastCatalogo) {
      // Se non ci sono cataloghi, inizia da CATG000000001
      return 'CATG000000001'
    }

    // Estrai il numero dal codice e incrementalo
    const lastNumber = parseInt(lastCatalogo.codice.replace('CATG', ''))
    const newNumber = lastNumber + 1
    
    // Formatta il nuovo codice con padding di zeri
    return `CATG${String(newNumber).padStart(9, '0')}`
  } catch (error) {
    console.error('Errore nella generazione del codice catalogo:', error)
    throw new Error('Errore nella generazione del codice catalogo')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nome,
      brand_id,
      tipo,
      stagione,
      anno,
      data_consegna,
      data_inizio_ordini,
      data_fine_ordini,
      note,
      condizioni,
      cover_url,
      stato
    } = body

    // Genera il nuovo codice catalogo
    const codice = await generateCatalogoCode()

    const { rows: [catalogo] } = await db.query(`
      INSERT INTO cataloghi (
        nome,
        codice,
        brand_id,
        tipo,
        stagione,
        anno,
        data_consegna,
        data_inizio_ordini,
        data_fine_ordini,
        note,
        condizioni,
        cover_url,
        stato
      ) VALUES (
        $1, 
        $2, 
        $3, 
        $4, 
        $5, 
        $6, 
        $7, 
        $8, 
        $9, 
        $10,
        $11,
        $12,
        $13
      ) RETURNING *
    `, [
      nome || null,
      codice,
      brand_id,
      tipo,
      stagione,
      anno,
      data_consegna || null,
      data_inizio_ordini || null,
      data_fine_ordini || null,
      note || null,
      condizioni || null,
      cover_url || null,
      stato
    ])

    return NextResponse.json(catalogo)
  } catch (error) {
    console.error('Errore nella creazione del catalogo:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del catalogo' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { rows: cataloghi } = await db.query(`
      SELECT c.*, b.name as brand_name
      FROM cataloghi c
      LEFT JOIN brands b ON c.brand_id = b.id
      ORDER BY c.created_at DESC
    `)
    console.log("cataloghi", cataloghi)
    return NextResponse.json(cataloghi)
  } catch (error) {
    console.error('Errore nel recupero dei cataloghi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei cataloghi' },
      { status: 500 }
    )
  }
} 

