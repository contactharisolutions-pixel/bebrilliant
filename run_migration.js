const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const fileName = process.argv[2] || 'master_data_migration.sql';
        const sql = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
        console.log(`Running Migration: ${fileName}...`);
        await pool.query(sql);
        console.log('Migration Completed Successfully!');
        process.exit(0);
    } catch (err) {

        console.error('Migration Failed:', err.message);
        process.exit(1);
    }
}

run();
