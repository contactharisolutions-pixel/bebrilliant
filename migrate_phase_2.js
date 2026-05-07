require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase2() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_2_schema.sql', 'utf8');
        
        console.log('Executing phase 2 schema...');
        await client.query(schemaSql);
        console.log('Phase 2 tables created successfully (brands, categories, stock, etc.).');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase2();
