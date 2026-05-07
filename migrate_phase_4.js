require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase4() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_4_schema.sql', 'utf8');
        
        console.log('Executing phase 4 schema...');
        await client.query(schemaSql);
        console.log('Phase 4 ecommerce schemas created successfully.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase4();
