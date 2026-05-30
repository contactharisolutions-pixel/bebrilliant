import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Postgres!');
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await client.end();
    }
}

check();
