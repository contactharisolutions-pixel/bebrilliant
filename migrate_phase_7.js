require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase7() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_7_schema.sql', 'utf8');
        
        console.log('Executing phase 7 Marketing/CRM Automation schema...');
        await client.query(schemaSql);
        console.log('Phase 7 Automation & Tracking structures created successfully.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase7();
