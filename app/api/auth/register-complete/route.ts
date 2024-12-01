import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const client = await db.connect()

  try {
    const { user, client: companyData } = await request.json()
    
    console.log('Dati ricevuti:', {
      user: { ...user, password: user.password ? '[PRESENTE]' : '[MANCANTE]' },
      client: companyData
    })

    // 1. Verifica se l'utente esiste già
    const { rows: existingUsers } = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [user.email]
    )

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      )
    }

    // 2. Verifica se l'azienda esiste già
    const { rows: existingCompanies } = await client.query(
      'SELECT * FROM clients WHERE vat_number = $1',
      [companyData.vat_number]
    )

    if (existingCompanies.length > 0) {
      return NextResponse.json(
        { error: 'Azienda già registrata' },
        { status: 400 }
      )
    }

    // 3. Crea l'utente
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    const { rows: [newUser] } = await client.query(`
      INSERT INTO users (
        email,
        password,
        nome,
        cognome,
        telefono,
        ruolo,
        attivo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, nome, cognome, ruolo
    `, [
      user.email,
      hashedPassword,
      user.nome,
      user.cognome,
      user.telefono,
      user.ruolo,
      user.attivo
    ])

    // 4. Crea il client
    const { rows: [newClient] } = await client.query(`
      INSERT INTO clients (
        user_id,
        company_name,
        vat_number,
        business,
        country,
        address,
        city,
        zip_code,
        company_email,
        company_phone,
        pec,
        sdi,
        stato
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'in_attesa_di_attivazione')
      RETURNING *
    `, [
      newUser.id,
      companyData.company_name,
      companyData.vat_number,
      companyData.business,
      companyData.country,
      companyData.address,
      companyData.city,
      companyData.zip_code,
      companyData.company_email,
      companyData.company_phone,
      companyData.pec || null,
      companyData.sdi || null
    ])

    return NextResponse.json({
      success: true,
      message: 'Registrazione completata con successo',
      user: newUser,
      client: newClient
    })

  } catch (error) {
    console.error('Errore dettagliato:', error)
    
    if (error.code === '23505') {
      if (error.constraint?.includes('users')) {
        return NextResponse.json(
          { error: 'Email già registrata' },
          { status: 400 }
        )
      }
      if (error.constraint?.includes('clients')) {
        return NextResponse.json(
          { error: 'Azienda già registrata' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Errore durante la registrazione. Verifica i dati inseriti.' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
} 