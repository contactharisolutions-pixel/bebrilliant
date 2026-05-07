
const db = require('./db');
async function run() {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit();
}
run();
