import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Funzione helper per generare il codice catalogo
async function generateCatalogoCode() {
  const { rows: [lastCatalogo] } = await db.query(`
    SELECT codice FROM cataloghi 
    ORDER BY created_at DESC 
    LIMIT 1
  `)

  if (!lastCatalogo) {
    return 'CATG000000001'
  }

  const lastNumber = parseInt(lastCatalogo.codice.replace('CATG', ''))
  const newNumber = lastNumber + 1
  return `CATG${String(newNumber).padStart(9, '0')}`
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

    const codice = await generateCatalogoCode()

    const { rows: [catalogo] } = await db.query(`
      INSERT INTO cataloghi (
        codice,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      codice,
      nome || null,
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
      stato || 'bozza'
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

export async function DELETE(
  request: Request,
  { params }: { params: { catalogoId: number } }
) {
  try {
    const { rows: [catalogo] } = await db.query(`
      DELETE FROM cataloghi 
      WHERE id = $1 
      RETURNING *
    `, [params.catalogoId])

    if (!catalogo) {
      return NextResponse.json(
        { error: 'Catalogo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Catalogo eliminato con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione del catalogo:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del catalogo' },
      { status: 500 }
    )
  }
}



export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rows: [catalogo] } = await db.query(`
      SELECT c.*, b.name as brand_name
      FROM cataloghi c
      LEFT JOIN brands b ON c.brand_id = b.id
      WHERE c.id = $1
    `, [params.id])

    if (!catalogo) {
      return NextResponse.json(
        { error: 'Catalogo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(catalogo)
  } catch (error) {
    console.error('Errore nel recupero del catalogo:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del catalogo' },
      { status: 500 }
    )
  }
} 

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const id = Number(params.id)
      if (isNaN(id)) {
        console.error('ID non valido:', params.id)
        return NextResponse.json(
          { error: 'ID catalogo non valido' },
          { status: 400 }
        )
      }
  
      console.log('ID catalogo (numero):', id)
      
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
  
      const { rows: [existing] } = await db.query(
        'SELECT id FROM cataloghi WHERE id = $1',
        [id]
      )
  
      if (!existing) {
        console.error('Catalogo non trovato per ID:', id)
        return NextResponse.json(
          { error: 'Catalogo non trovato' },
          { status: 404 }
        )
      }
  
      const { rows: [catalogo] } = await db.query(`
        UPDATE cataloghi 
        SET 
          nome = $1,
          brand_id = $2,
          tipo = $3,
          stagione = $4,
          anno = $5,
          data_consegna = $6,
          data_inizio_ordini = $7,
          data_fine_ordini = $8,
          note = $9,
          condizioni = $10,
          cover_url = $11,
          stato = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        nome || null,
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
        stato,
        id
      ])
  
      return NextResponse.json(catalogo)
    } catch (error) {
      console.error('Errore nell\'aggiornamento del catalogo:', error)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento del catalogo' },
        { status: 500 }
      )
    }
  }

