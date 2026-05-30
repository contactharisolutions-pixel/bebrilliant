import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

async function reload() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected. Reloading schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Schema reload notification sent.');
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await client.end();
    }
}

reload();
