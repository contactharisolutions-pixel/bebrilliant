const db = require('../db');
async function run() {
    const r = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    const names = r.rows.map(x => x.table_name);
    names.forEach(n => console.log(n));
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
