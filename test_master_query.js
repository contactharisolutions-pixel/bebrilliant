const db = require('./db');
// Mock req.user
const req = { user: { id: 'usr_admin_001', role: 'Admin' }, params: { table: 'brands' } };

async function testRoutes() {
    const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials'];
    for (const t of TABLES) {
        const business_id = req.user.business_id || 'biz_blink_001';
        const { rows } = await db.query(
            `SELECT * FROM ${t} WHERE business_id = $1 ORDER BY created_at DESC`,
            [business_id]
        );
        console.log(`Table ${t}: Found ${rows.length} rows for ${business_id}`);
    }
    process.exit();
}
testRoutes();
