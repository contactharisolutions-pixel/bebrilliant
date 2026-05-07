const db = require('./db');
async function check() {
    try {
        const r = await db.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        r.rows.forEach(x => console.log(x.tablename));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
