require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migratePhase9() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const schemaSql = fs.readFileSync('phase_9_schema.sql', 'utf8');
        
        console.log('Executing phase 9 Advanced Features schema...');
        await client.query(schemaSql);
        console.log('Phase 9 Eye Test, Repairs, Loyalty & Appointment tables successfully migrated.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migratePhase9();
