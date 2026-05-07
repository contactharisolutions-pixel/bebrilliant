const db = require('./db');
async function fixAll() {
    const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors'];
    for (const t of TABLES) {
        try {
            const r = await db.query(`UPDATE ${t} SET business_id = 'biz_blink_001' WHERE business_id IS NULL`);
            console.log(`${t}: updated ${r.rowCount} rows`);
        } catch (e) {
            console.log(`${t}: skipped (${e.message})`);
        }
    }
    process.exit();
}
fixAll();
