require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase6() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_6_schema.sql', 'utf8');
        
        console.log('Executing phase 6 Advanced CMS schema...');
        await client.query(schemaSql);
        console.log('Phase 6 CMS & Media libraries created successfully.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase6();
