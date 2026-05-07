require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase3() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_3_schema.sql', 'utf8');
        
        console.log('Executing phase 3 schema...');
        await client.query(schemaSql);
        console.log('Phase 3 tables created successfully (POS Cart, Prescription, Payments).');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase3();
