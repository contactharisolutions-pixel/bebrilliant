// Run via: node migrations/create_ai_log.js (uses app db.js which has SSL config)
const db = require('../db');
async function run() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_processing_log (
                log_id          TEXT PRIMARY KEY,
                business_id     TEXT NOT NULL,
                product_id      TEXT,
                match_status    TEXT,
                confidence_score NUMERIC(5,2),
                processed_by    TEXT,
                processed_at    TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✓ ai_processing_log table ready');
    } catch (err) {
        console.error('Migration error:', err.message);
    }
    process.exit();
}
run();
