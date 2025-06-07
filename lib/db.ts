import { Pool } from 'pg';
import { sql as postgresSQL } from '@vercel/postgres';

export const runtime = 'nodejs';

// Pool per connessioni dirette
const {
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
} = process.env;

if (!DB_USER) throw new Error('DB_USER non definito');
if (!DB_HOST) throw new Error('DB_HOST non definito');
if (!DB_NAME) throw new Error('DB_NAME non definito');
if (!DB_PASSWORD) throw new Error('DB_PASSWORD non definito');
if (!DB_PORT) throw new Error('DB_PORT non definito');

export const db = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: parseInt(DB_PORT, 10),
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