const db = require('./db');

async function migrate() {
    try {
        console.log('--- Enhancing Showroom Table Schema ---');
        
        // Add missing columns if they don't exist
        const queries = [
            `ALTER TABLE showroom ADD COLUMN IF NOT EXISTS email VARCHAR(100)`,
            `ALTER TABLE showroom ADD COLUMN IF NOT EXISTS google_maps_link TEXT`,
            `ALTER TABLE showroom ADD COLUMN IF NOT EXISTS gstin VARCHAR(20)`,
            `ALTER TABLE showroom ADD COLUMN IF NOT EXISTS secondary_contact VARCHAR(100)`
        ];

        for(let q of queries) {
            await db.query(q);
        }

        console.log('Success: Showroom schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
