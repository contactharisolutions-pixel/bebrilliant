import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

async function repair() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Postgres.');

        console.log('1. Restoring essential permissions for GoTrue/PostgREST...');
        await client.query(`
            -- Ensure schemas are accessible
            GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator, service_role;
            GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator, service_role;

            -- Ensure auth tables are readable by the authenticator/service_role
            GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator, service_role;
            
            -- Ensure public tables are readable
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

            -- Extensions
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            -- Reload
            NOTIFY pgrst, 'reload schema';
        `);

        console.log('2. Checking for common schema issues...');
        const res = await client.query("SELECT count(*) FROM pg_extension WHERE extname = 'pgcrypto'");
        console.log('pgcrypto installed:', res.rows[0].count > 0);

        console.log('Repair attempt finished.');
    } catch (e) {
        console.error('Repair Error:', e.message);
    } finally {
        await client.end();
    }
}

repair();
