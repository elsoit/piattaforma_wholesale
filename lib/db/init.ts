import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function initializeDatabase() {
  try {
    // Leggi il file SQL
    const sqlFile = path.join(process.cwd(), 'scripts', 'init-db.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // Esegui le query
    await db.query(sqlContent)
    
    console.log('Database initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}

// Funzione per verificare se il database esiste
export async function checkDatabaseExists() {
  try {
    // Prova a fare una query su una tabella base
    await db.query('SELECT 1 FROM users LIMIT 1')
    return true
  } catch (error) {
    return false
  }
} 