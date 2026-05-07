require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase8() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_8_schema.sql', 'utf8');
        
        console.log('Executing phase 8 Reports & GST Analytics schema...');
        await client.query(schemaSql);
        console.log('Phase 8 Reporting schemas safely migrated.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase8();
