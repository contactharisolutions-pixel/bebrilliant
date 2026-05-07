const db = require('./db');
async function run() {
    const r1 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'product'");
    const r2 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'variant'");
    const r3 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory'");
    
    console.log('Product:', r1.rows.map(c => c.column_name));
    console.log('Variant:', r2.rows.map(c => c.column_name));
    console.log('Inventory:', r3.rows.map(c => c.column_name));
    
    process.exit();
}
run();
