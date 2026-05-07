const db = require('./db');
async function check() {
    try {
        const r = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', r.rows.map(row => row.table_name));
        
        const TABLES = ['brands', 'categories', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors'];
        for (const t of TABLES) {
            const r = await db.query(`SELECT COUNT(*) as count FROM ${t} WHERE business_id IS NULL`);
            console.log(`Table ${t} - Null Biz ID Count:`, r.rows[0].count);
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit();
}
check();
