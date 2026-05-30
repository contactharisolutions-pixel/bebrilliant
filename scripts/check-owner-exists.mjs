import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query("SELECT email FROM auth.users WHERE email = 'owner@brightboard.in'");
        console.log('User found:', res.rows.length > 0);
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await client.end();
    }
}

check();
