require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to Supabase PostgreSQL database successfully!');

        const schemaSql = fs.readFileSync('schema.sql', 'utf8');
        
        console.log('Executing schema.sql...');
        await client.query(schemaSql);
        console.log('Migration completed successfully. All tables created.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

migrate();
