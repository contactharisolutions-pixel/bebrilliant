import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Postgres!');
        const res = await client.query("SELECT count(*) FROM auth.users");
        console.log('User count in auth.users:', res.rows[0].count);
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await client.end();
    }
}

check();
