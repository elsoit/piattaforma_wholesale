import { Pool } from 'pg';

export const runtime = 'nodejs';

export const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'piattaforma',
  password: '123456',
  port: parseInt('5432'),
});

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