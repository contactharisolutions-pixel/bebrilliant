const db = require('./db');
async function check() {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'eye_test'");
        console.log('Eye Test Columns:', res.rows.map(r => r.column_name));
    } catch (e) {
        console.error('Check failed:', e.message);
    }
    process.exit();
}
check();
