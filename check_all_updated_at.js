const db = require('./db');
async function checkAll() {
    const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors'];
    for (const t of TABLES) {
        const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}'`);
        const cols = res.rows.map(c => c.column_name);
        if (!cols.includes('updated_at')) {
            console.log(`Table ${t} is MISSING updated_at`);
        } else {
            console.log(`Table ${t} has updated_at`);
        }
    }
    process.exit();
}
checkAll();
