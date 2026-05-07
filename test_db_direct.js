const db = require('./db');

async function testApi() {
    const table = 'brands';
    const business_id = 'biz_blink_001';
    
    // Exact SQL from master.routes.js
    const { rows } = await db.query(
        `SELECT * FROM ${table} WHERE business_id = $1 ORDER BY created_at DESC`,
        [business_id]
    );
    
    console.log('Result for biz_blink_001:', rows);
    
    // Check if there are ANY records in categories
    const r2 = await db.query("SELECT * FROM categories");
    console.log('Categories Total:', r2.rows.length);
    if (r2.rows.length > 0) console.log('Sample Category:', r2.rows[0]);
}

testApi().then(() => process.exit());
