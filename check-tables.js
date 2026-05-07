const db = require('./db');
async function check() {
    try {
        const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%loyalty%'");
        console.log('Loyalty Tables:', res.rows.map(r => r.table_name));
    } catch (e) {
        console.error('Check failed:', e.message);
    }
    process.exit();
}
check();
