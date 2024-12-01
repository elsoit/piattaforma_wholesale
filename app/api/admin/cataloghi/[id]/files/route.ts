import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET endpoint per ottenere i file
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('GET - Fetching files for catalogo:', params.id)
  
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'all'

    let query = `
      SELECT 
        cf.id,
        cf.nome,
        cf.description,
        cf.tipo,
        cf.file_url,
        cf.created_at,
        cf.updated_at,
        c.nome as catalogo_nome
      FROM catalogo_files cf
      LEFT JOIN cataloghi c ON c.id = cf.catalogo_id
      WHERE cf.catalogo_id = $1
    `
    const queryParams = [params.id]

    if (tipo !== 'all') {
      query += ` AND cf.tipo = $2`
      queryParams.push(tipo)
    }

    query += ` ORDER BY cf.created_at DESC`

    const { rows } = await db.query(query, queryParams)
    return NextResponse.json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error('Errore recupero files:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei file' },
      { status: 500 }
    )
  }
}



export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const nome = formData.get('nome') as string;
    const description = formData.get('description') as string;
    const tipo = formData.get('tipo') as string;
    const file_url = formData.get('file_url') as string;

    if (!file_url) {
      return NextResponse.json(
        { error: 'URL del file mancante' },
        { status: 400 }
      );
    }

    // Verifica che il catalogo esista
    const catalogo = await db.query(
      'SELECT id FROM cataloghi WHERE id = $1',
      [params.id]
    );

    if (catalogo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Catalogo non trovato' },
        { status: 404 }
      );
    }

    // Inserisci il file nel database
    const result = await db.query(
      `INSERT INTO catalogo_files (nome, description, tipo, file_url, catalogo_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nome, description, tipo, file_url, params.id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Errore creazione file:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del file' },
      { status: 500 }
    );
  }
}

