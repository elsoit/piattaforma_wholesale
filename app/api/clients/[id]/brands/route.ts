import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { brandActivatedTemplate } from '@/lib/email-templates/brand-activated'

interface BrandUpdateRequest {
  brandIds: string[]
}

// GET: Ottiene i brand associati al cliente
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = await params.id
  
  try {
    const result = await db.query(`
      SELECT b.* 
      FROM brands b
      INNER JOIN client_brands cb ON b.id = cb.brand_id
      WHERE cb.client_id = $1
    `, [id])

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero dei brand' },
      { status: 500 }
    )
  }
}

// PUT: Aggiorna i brand associati al cliente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = await params.id
  const dbClient = await db.connect()
  
  try {
    const { brandIds } = await request.json() as BrandUpdateRequest
    console.log('📝 [BRANDS] Richiesta di aggiornamento brand:', { clientId: id, brandIds })
    
    await dbClient.query('BEGIN')

    // 1. Recupera i brand attuali del cliente
    const { rows: currentBrands } = await dbClient.query(`
      SELECT brand_id 
      FROM client_brands 
      WHERE client_id = $1
    `, [id])
    const currentBrandIds = currentBrands.map(b => b.brand_id)
    console.log('📝 [BRANDS] Brand attuali:', currentBrandIds)

    // 2. Identifica i brand veramente nuovi (non presenti tra quelli attuali)
    const newBrandIds = brandIds.filter(id => !currentBrandIds.includes(id))
    console.log('📝 [BRANDS] Nuovi brand da attivare:', newBrandIds)

    // 3. Se ci sono brand nuovi, recupera i dati del cliente per l'email e la notifica
    if (newBrandIds.length > 0) {
      const { rows: [client] } = await dbClient.query(`
        SELECT 
          c.*,
          u.nome,
          u.email as user_email,
          u.id as user_id
        FROM clients c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `, [id])

      console.log('📝 [BRANDS] Dati cliente recuperati:', { 
        clientId: client.id,
        userId: client.user_id,
        email: client.user_email 
      })

      // 4. Recupera i nomi dei nuovi brand
      const { rows: newBrands } = await dbClient.query(`
        SELECT id, name
        FROM brands 
        WHERE id = ANY($1)
      `, [newBrandIds])

      console.log('📝 [BRANDS] Dettagli nuovi brand:', newBrands)

      // 5. Crea una notifica per ogni nuovo brand
      for (const brand of newBrands) {
        console.log('📝 [BRANDS] Creazione notifica per brand:', brand.name)
        
        const { rows: [notification] } = await dbClient.query(`
          INSERT INTO notifications (
            user_id,
            type,
            icon,
            color,
            brand_id,
            brand_name,
            message,
            read,
            created_at
          ) VALUES (
            $1,
            'BRAND_ACTIVATION',
            'store',
            'green',
            $2,
            $3,
            $4,
            false,
            CURRENT_TIMESTAMP
          ) RETURNING *
        `, [
          client.user_id,
          brand.id,
          brand.name,
          `Il brand ${brand.name} è stato attivato per la tua azienda`
        ])

        console.log('✅ [BRANDS] Notifica creata:', notification)
      }

      // 6. Invia l'email solo per i brand nuovi
      try {
        await sendEmail({
          to: client.user_email,
          subject: 'Nuovi Brand Attivati',
          template: 'brand-activated',
          data: {
            nome: client.nome,
            company_name: client.company_name,
            brand_names: newBrands.map(b => b.name)
          }
        })

        console.log('✅ [BRANDS] Email di attivazione inviata per i nuovi brand:', 
          newBrands.map(b => b.name).join(', ')
        )
      } catch (emailError) {
        console.error('❌ [BRANDS] Errore nell\'invio dell\'email di attivazione brand:', emailError)
      }
    }

    // 7. Aggiorna tutti i brand (sia aggiunti che rimossi)
    await dbClient.query(
      'DELETE FROM client_brands WHERE client_id = $1',
      [id]
    )

    if (brandIds.length > 0) {
      const values = brandIds.map((_, index) => 
        `($1, $${index + 2})`
      ).join(',')
      
      await dbClient.query(`
        INSERT INTO client_brands (client_id, brand_id)
        VALUES ${values}
      `, [id, ...brandIds])
    }

    await dbClient.query('COMMIT')
    console.log('✅ [BRANDS] Transazione completata con successo')

    return NextResponse.json({ 
      success: true, 
      message: 'Brand aggiornati con successo' 
    })

  } catch (error) {
    await dbClient.query('ROLLBACK')
    console.error('❌ [BRANDS] Errore nell\'aggiornamento dei brand:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dei brand' },
      { status: 500 }
    )
  } finally {
    dbClient.release()
  }
} 