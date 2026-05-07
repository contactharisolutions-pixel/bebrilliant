const db = require('./db');
async function run() {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'variant'");
    console.log('Variant Cols:', res.rows);
    
    const res2 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'inventory'");
    console.log('Inventory Cols:', res2.rows);
    
    process.exit();
}
run();
