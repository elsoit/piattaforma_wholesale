import { Pool } from 'pg';
import { sql as postgresSQL } from '@vercel/postgres';

export const runtime = 'nodejs';

// Pool per connessioni dirette
export const db = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'piattoforma',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// SQL helper per query parametrizzate
export const sql = postgresSQL;

// Funzione di test della connessione
export async function testConnection() {
    try {
        const client = await db.connect();
        console.log('✅ Connessione al database riuscita');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Errore di connessione al database:', err);
        return false;
    }
} 
