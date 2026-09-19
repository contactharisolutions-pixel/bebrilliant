import { Pool } from 'pg'

function getPoolConfig() {
  const dbUrl = process.env.DATABASE_URL
  const useSsl = Boolean(
    dbUrl?.includes('sslmode=require') || 
    process.env.DATABASE_SSL === 'true'
  )

  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl)
      return {
        user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 5432,
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      }
    } catch {
      return {
        connectionString: dbUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      }
    }
  }

  return {
    ssl: useSsl ? { rejectUnauthorized: false } : false
  }
}

export const pool = new Pool(getPoolConfig())

export async function query(text: string, params?: any[]) {
  return pool.query(text, params)
}
