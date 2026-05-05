import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres'

async function run() {
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
    await client.connect()
    
    console.log('⚡ Confirming test_student_123...')
    await client.query(`
        UPDATE auth.users 
        SET email_confirmed_at = NOW()
        WHERE email = 'test_student_123@brightboard.in'
    `)
    
    await client.end()
    console.log('✅ Done.')
}

run().catch(console.error)
