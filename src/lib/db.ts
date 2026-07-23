import { Pool } from 'pg'

const isLocalDb = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('localhost') || 
  process.env.DATABASE_URL.includes('127.0.0.1')
)

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false }
})

export async function query(text: string, params?: any[]) {
  return pool.query(text, params)
}
