import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

interface CatalogoDetails {
  id: number
  nome: string | null
  codice: string
  brand_name: string
  tipo: string
  stagione: string
  anno: number
}

interface ActiveClient {
  user_id: string
  email: string
  nome: string
  cognome: string
  client_id: string
  company_name: string
}

function formatEmailSubject(catalogoDetails: CatalogoDetails): string {
  const { brand_name, tipo, stagione, anno } = catalogoDetails

  if (tipo === 'Preordine') {
    // Estrai le ultime due cifre dell'anno
    const yearSuffix = anno.toString().slice(-2)
    
    // Formatta la stagione
    let seasonCode = ''
    if (stagione.includes('FALL-WINTER')) {
      seasonCode = 'FW'
    } else if (stagione.includes('SPRING-SUMMER')) {
      seasonCode = 'SS'
    }
    
    // Aggiungi "PRE" se presente nella stagione
    const prePrefix = stagione.includes('PRE') ? 'PRE ' : ''
    
    return `${brand_name} ${prePrefix}${seasonCode}${yearSuffix} Preorders Open Now!`
  } else {
    // Per tutti gli altri tipi, escluso "Disponibile"
    if (tipo === 'Disponibile') {
      return `New List ${brand_name} Available Now!`
    } else {
      return `New List ${brand_name} ${tipo} Available Now!`
    }
  }
}

function formatNotificationMessage(catalogoDetails: CatalogoDetails): string {
  const { brand_name, tipo, stagione, anno, nome, codice } = catalogoDetails

  if (tipo === 'Preordine') {
    // Estrai le ultime due cifre dell'anno
    const yearSuffix = anno.toString().slice(-2)
    
    // Formatta la stagione
    let seasonCode = ''
    if (stagione.includes('FALL-WINTER')) {
      seasonCode = 'FW'
    } else if (stagione.includes('SPRING-SUMMER')) {
      seasonCode = 'SS'
    }
    
    // Aggiungi "PRE" se presente nella stagione
    const prePrefix = stagione.includes('PRE') ? 'PRE ' : ''
    
    return `${brand_name} ${prePrefix}${seasonCode}${yearSuffix} Preorders Open Now!`
  } else {
    // Per tutti gli altri tipi, escluso "Disponibile"
    if (tipo === 'Disponibile') {
      return `New List ${brand_name} Available Now!`
    } else {
      return `New List ${brand_name} ${tipo} Available Now!`
    }
  }
}

export async function notifyCatalogPublication(catalogoId: number, brandId: string) {
  try {
    console.log('🚀 Inizio notifica pubblicazione catalogo:', { catalogoId, brandId })

    // Recupera i dettagli del catalogo e del brand
    const { rows: [catalogoDetails] } = await db.query<CatalogoDetails>(`
      SELECT 
        c.id,
        c.nome,
        c.codice,
        c.tipo,
        c.stagione,
        c.anno,
        b.name as brand_name 
      FROM cataloghi c
      JOIN brands b ON c.brand_id = b.id
      WHERE c.id = $1
    `, [catalogoId])

    if (!catalogoDetails) {
      throw new Error('Catalogo non trovato')
    }

    // Recupera tutti i clienti attivi che hanno quel brand
    const { rows: activeClients } = await db.query<ActiveClient>(`
      SELECT DISTINCT 
        u.id as user_id,
        u.email,
        u.nome,
        u.cognome,
        c.id as client_id,
        c.company_name
      FROM clients c
      JOIN users u ON c.user_id = u.id
      JOIN client_brands cb ON c.id = cb.client_id
      WHERE cb.brand_id = $1
      AND c.stato = 'attivo'
      AND u.attivo = true
    `, [brandId])

    if (activeClients.length === 0) {
      console.log('⚠️ Nessun cliente attivo trovato per questo brand')
      return true
    }

    console.log('📧 Invio notifiche a:', activeClients.map(c => c.email))

    await Promise.all([
      // Notifiche DB
      ...activeClients.map(client => 
        db.query(`
          INSERT INTO notifications (
            user_id,
            type,
            message,
            icon,
            color,
            read
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          client.user_id,
          'CATALOG_ADDED',
          formatNotificationMessage(catalogoDetails),
          'BookOpenCheck',
          'blue',
          false
        ])
      ),
      // Email con soggetto formattato in base al tipo
      ...activeClients.map(client => 
        sendEmail({
          to: client.email,
          subject: formatEmailSubject(catalogoDetails),
          template: 'catalog-published',
          data: {
            userName: `${client.nome} ${client.cognome}`,
            brandName: catalogoDetails.brand_name,
            catalogName: catalogoDetails.nome || '',
            catalogCode: catalogoDetails.codice
          }
        })
      )
    ])

    return true
  } catch (error) {
    console.error('❌ Errore nell\'invio delle notifiche:', error)
    throw error
  }
}