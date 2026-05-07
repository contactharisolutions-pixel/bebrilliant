const db = require('./db');
async function run() {
    try {
        const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('TABLES:', tables.rows.map(r => r.table_name).join(', '));
        
        for (const table of ['product', 'variant', 'order_item', 'customer_order', 'brands', 'categories', 'genders', 'showroom']) {
            try {
                const cols = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${table}'`);
                console.log(`COLUMNS (${table}):`, cols.rows.map(r => r.column_name).join(', '));
            } catch (e) {
                console.log(`TABLE NOT FOUND: ${table}`);
            }
        }
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit(0);
}
run();
