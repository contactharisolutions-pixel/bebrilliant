require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase5() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_5_schema.sql', 'utf8');
        
        console.log('Executing phase 5 CRM schema...');
        await client.query(schemaSql);
        console.log('Phase 5 CRM tables created/altered successfully.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase5();
