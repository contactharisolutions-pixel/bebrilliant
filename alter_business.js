require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');

async function alterTable() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        
        await client.query(`ALTER TABLE business ADD COLUMN IF NOT EXISTS base_currency VARCHAR(10) DEFAULT 'INR';`);
        await client.query(`ALTER TABLE business ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';`);
        await client.query(`ALTER TABLE business ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY';`);
        
        console.log('Business table updated with default currency, timezone, and date format constraints.');

    } catch (err) {
        console.error('Alter failed:', err.message);
    } finally {
        await client.end();
    }
}

alterTable();
