import pg from 'pg'
const { Client } = pg

const client = new Client({ connectionString: 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } })

client.connect().then(async () => {
    try {
      // Terminate all connections except our own
      const { rows } = await client.query(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND pid <> pg_backend_pid()
        AND state = 'idle';
      `)
      console.log('Terminated idle connections:', rows.length)
    } finally {
      client.end()
    }
})
