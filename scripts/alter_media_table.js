const db = require('../db');
async function run() {
    await db.query(`
        ALTER TABLE media_library ADD COLUMN IF NOT EXISTS thumbnail_url text;
        ALTER TABLE media_library ADD COLUMN IF NOT EXISTS file_size integer;
        ALTER TABLE media_library ADD COLUMN IF NOT EXISTS created_by text;
    `);
    
    // Also check if id exists, change to media_id or alias
    // It's probably easier to return 'media_id AS id' in the routes or change erp-views to use media_id.
    // Changing erp-views to use media_id and fixing the POST API.
    console.log("Table altered successfully.");
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
