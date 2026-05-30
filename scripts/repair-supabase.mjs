import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

async function repair() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Postgres.');

        console.log('1. Granting permissions on auth schema...');
        await client.query(`
            GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
            GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
        `);

        console.log('2. Ensuring pgcrypto is enabled...');
        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        console.log('3. Notifying PostgREST reload...');
        await client.query("NOTIFY pgrst, 'reload schema'");

        console.log('Repair attempt finished.');
    } catch (e) {
        console.error('Repair Error:', e.message);
    } finally {
        await client.end();
    }
}

repair();
