const db = require('./db');

async function migrate() {
    try {
        console.log('--- Enhancing Business Table Schema ---');
        
        const queries = [
            `ALTER TABLE business ADD COLUMN IF NOT EXISTS logo_url TEXT`,
            `ALTER TABLE business ADD COLUMN IF NOT EXISTS pan_no VARCHAR(20)`,
            `ALTER TABLE business ADD COLUMN IF NOT EXISTS gstin_main VARCHAR(20)`,
            `ALTER TABLE business ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'Basic'`
        ];

        for(let q of queries) {
            await db.query(q);
        }

        console.log('Success: Business schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
