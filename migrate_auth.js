require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migrateAuth() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const sql = fs.readFileSync('auth_schema.sql', 'utf8');
        console.log('Migrating Auth Schema...');
        await client.query(sql);
        console.log('Auth Schema Migrated successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
migrateAuth();
