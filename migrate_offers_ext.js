// migrate_offers_ext.js
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.development') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to Supabase for Marketing Migration...');

        // 1. Add new columns to 'offer' table
        await client.query(`
            ALTER TABLE offer 
            ADD COLUMN IF NOT EXISTS apply_target TEXT,
            ADD COLUMN IF NOT EXISTS channel_scope TEXT DEFAULT 'All',
            ADD COLUMN IF NOT EXISTS showroom_targets JSONB DEFAULT '[]';
        `);
        console.log('✅ Offer table columns added successfully.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
