import { Pool } from 'pg'

const useSsl = Boolean(
  process.env.DATABASE_URL?.includes('sslmode=require') || 
  process.env.DATABASE_SSL === 'true'
)

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
})

export async function query(text: string, params?: any[]) {
  return pool.query(text, params)
}
