const db = require('./db');

async function migrate() {
    console.log('--- Migrating Accounting Module (Showroom Integration) ---');
    try {
        await db.query(`
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS showroom_id TEXT;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS showroom_id TEXT;
            ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS showroom_id TEXT;
            
            -- Add indices for performance
            CREATE INDEX IF NOT EXISTS idx_expenses_showroom ON expenses(showroom_id);
            CREATE INDEX IF NOT EXISTS idx_payments_showroom ON payments(showroom_id);
            CREATE INDEX IF NOT EXISTS idx_journal_showroom ON journal_entries(showroom_id);
        `);
        console.log('✅ Added showroom_id to expenses, payments, and journal_entries');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
