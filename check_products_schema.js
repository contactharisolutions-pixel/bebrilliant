const db = require('./db');
async function run() {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
    console.log(res.rows);
    process.exit();
}
run();
