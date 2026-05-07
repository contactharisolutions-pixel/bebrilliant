const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sqlFiles = [
    'schema.sql',
    'phase_2_schema.sql',
    'phase_3_schema.sql',
    'phase_4_schema.sql',
    'phase_5_schema.sql',
    'phase_6_schema.sql',
    'phase_7_schema.sql',
    'phase_8_schema.sql',
    'phase_9_schema.sql',
    'auth_schema.sql',
    'settings_schema.sql',
    'tax_schema.sql',
    'order_items_schema.sql',
    'communication_schema.sql',
    'vto_schema.sql',
    'master_data_migration.sql',
    'migrations/cms_schema.sql',
    'migrations/gst_eyewear_rules.sql',
    'migrations/allow_multi_tax_per_category.sql'
];

const seedScripts = [
    'seed_admin.js',
    'seed_master_data.js',
    'seed_products.js'
];

async function run() {
    console.log('Target Project:', process.env.SUPABASE_URL);
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to NEW project database...');

        for (const file of sqlFiles) {
            console.log(`Executing SQL: ${file}...`);
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            await client.query(sql);
            console.log(`✓ ${file} executed successfully.`);
        }

        await client.end();
        console.log('SQL Migrations Finished. Starting JS Seeds...');

        for (const script of seedScripts) {
            console.log(`Running seed script: ${script}...`);
            try {
                execSync(`node ${script}`, { stdio: 'inherit' });
                console.log(`✓ ${script} finished.`);
            } catch (err) {
                console.error(`Error running ${script}:`, err.message);
            }
        }

        console.log('\n🚀 ALL MIGRATIONS AND SEEDS COMPLETED SUCCESSFULLY ON NEW PROJECT!');
    } catch (err) {
        console.error('Migration Failed:', err.message);
        if (client) await client.end();
        process.exit(1);
    }
}

run();
