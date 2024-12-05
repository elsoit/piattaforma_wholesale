import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

interface RegisterRequest {
  user: {
    email: string
    password: string
    nome: string
    cognome: string
    telefono: string
    ruolo: string
    attivo: boolean
  }
  client: {
    company_name: string
    vat_number: string
    business: string
    country: string
    address: string
    city: string
    zip_code: string
    company_email: string
    company_phone: string
    pec?: string
    sdi?: string
    province: string
    region: string
    acceptPrivacy: boolean
    acceptNewsletter: boolean
  }
}

// Funzione per validare la partita IVA in base al paese
function validateVatNumber(vatNumber: string, country: string): boolean {
  // Rimuovi spazi e converti in maiuscolo
  vatNumber = vatNumber.replace(/\s/g, '').toUpperCase()

  const vatRules: { [key: string]: RegExp } = {
    'IT': /^[0-9]{11}$/, // Italia: 11 numeri
    'FR': /^[A-Z0-9]{2}[0-9]{9}$/, // Francia
    'DE': /^[0-9]{9}$/, // Germania
    'ES': /^[A-Z0-9][0-9]{7}[A-Z0-9]$/, // Spagna
    'GB': /^[0-9]{9}$|^[0-9]{12}$|^GD[0-9]{3}$|^HA[0-9]{3}$/, // UK
  }

  // Se non abbiamo una regola specifica per il paese, verifica solo che sia alfanumerico e almeno 5 caratteri
  if (!vatRules[country]) {
    return /^[A-Z0-9]{5,}$/.test(vatNumber)
  }

  return vatRules[country].test(vatNumber)
}

// Aggiungi la regex per la validazione PEC
const pecRegex = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*pec(?:\.it|\.ad|\.ch)$/;

export async function POST(request: Request) {
  const dbClient = await db.connect()

  try {
    const body = await request.json() as RegisterRequest
    const { user, client: companyData } = body

    // Validazione PEC se presente
    if (companyData.pec && !pecRegex.test(companyData.pec)) {
      return NextResponse.json(
        { error: 'Formato PEC non valido' },
        { status: 400 }
      )
    }

    // 1. Validazione della partita IVA in base al paese
    if (!validateVatNumber(companyData.vat_number, companyData.country)) {
      return NextResponse.json(
        { error: 'Formato partita IVA non valido per il paese selezionato' },
        { status: 400 }
      )
    }

    // 2. Verifica se esiste già la combinazione VAT + Country
    const { rows: existingVatCountry } = await dbClient.query(
      'SELECT id FROM clients WHERE UPPER(vat_number) = UPPER($1) AND country = $2',
      [companyData.vat_number, companyData.country]
    )

    if (existingVatCountry.length > 0) {
      return NextResponse.json(
        { error: `Partita IVA ${companyData.vat_number} già registrata per il paese ${companyData.country}` },
        { status: 400 }
      )
    }

    // 3. Verifica email utente
    const { rows: existingUsers } = await dbClient.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [user.email]
    )

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      )
    }



    // 5. Verifica requisiti per aziende italiane
    if (companyData.country === 'IT') {
      // Verifica che sia presente almeno PEC o SDI
      if (!companyData.pec && !companyData.sdi) {
        return NextResponse.json(
          { error: 'Per le aziende italiane è necessario specificare almeno PEC o SDI' },
          { status: 400 }
        )
      }

      // Verifica formato SDI
      if (companyData.sdi && !/^[A-Z0-9]{7}$/.test(companyData.sdi)) {
        return NextResponse.json(
          { error: 'Formato SDI non valido' },
          { status: 400 }
        )
      }
    }

    // Se tutti i controlli sono passati, inizia la transazione
    await dbClient.query('BEGIN')

    try {
      // 6. Crea l'utente
      const hashedPassword = await bcrypt.hash(user.password, 10)
      
      const { rows: [newUser] } = await dbClient.query(`
        INSERT INTO users (
          email, password, nome, cognome, telefono, ruolo, attivo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, nome, cognome, ruolo
      `, [
        user.email.toLowerCase(),
        hashedPassword,
        user.nome,
        user.cognome,
        user.telefono,
        user.ruolo,
        user.attivo
      ])

      // 7. Crea il client
      const { rows: [newClient] } = await dbClient.query(`
        INSERT INTO clients (
          user_id, company_name, vat_number, business, 
          country, address, city, zip_code, province, region,
          company_email, company_phone, pec, sdi,
          privacy_accepted, newsletter_subscribed,
          stato
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16,
          'in_attesa_di_attivazione'
        )
        RETURNING *
      `, [
        newUser.id,
        companyData.company_name.trim(),
        companyData.vat_number.toUpperCase().trim(),
        companyData.business,
        companyData.country,
        companyData.address.trim(),
        companyData.city?.trim() || '',
        companyData.zip_code?.trim() || '',
        companyData.province?.trim() || '',
        companyData.region?.trim() || '',
        companyData.company_email.toLowerCase().trim(),
        companyData.company_phone.trim(),
        companyData.pec?.toLowerCase().trim() || null,
        companyData.sdi?.toUpperCase().trim() || null,
        Boolean(companyData.acceptPrivacy),
        Boolean(companyData.acceptNewsletter)
      ])

      const verificationToken = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token valido per 24 ore

      // Salva il token nel database
      await dbClient.query(`
        INSERT INTO email_verifications (
          user_id, email, token, expires_at, 
          ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        newUser.id,
        user.email.toLowerCase(),
        verificationToken,
        expiresAt,
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      ])

      // Invia l'email di verifica
      await sendVerificationEmail(
        user.email,
        user.nome,
        verificationToken
      )

      await dbClient.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Registrazione completata con successo',
        user: newUser,
        client: newClient
      })

    } catch (error) {
      await dbClient.query('ROLLBACK')
      throw error
    }

  } catch (error: any) {
    console.error('Errore dettagliato:', error)
    return NextResponse.json(
      { error: 'Errore durante la registrazione. Verifica i dati inseriti.' },
      { status: 500 }
    )
  } finally {
    dbClient.release()
  }
} 