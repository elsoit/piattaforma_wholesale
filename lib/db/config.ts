import { Pool, PoolConfig } from 'pg'
import { config } from '@/config/environment'

const poolConfig: PoolConfig = {
  connectionString: config.database.url,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
}

export const db = new Pool(poolConfig) 