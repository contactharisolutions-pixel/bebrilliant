const db = require('./db');

async function test() {
    try {
        const query = `
            SELECT t.*, 
                   p.product_name, v.sku, v.barcode,
                   fs.showroom_name as from_name, 
                   ts.showroom_name as to_name,
                   u.name as requested_by_name
            FROM stock_transfer t
            JOIN product p ON t.product_id = p.product_id
            JOIN variant v ON t.variant_id = v.variant_id
            LEFT JOIN showroom fs ON t.from_showroom_id = fs.showroom_id
            LEFT JOIN showroom ts ON t.to_showroom_id = ts.showroom_id
            LEFT JOIN app_user u ON t.requested_by = u.user_id
            WHERE t.business_id = $1
        `;
        const result = await db.query(query, ['biz_blink_001']);
        console.log('Query Success:', result.rows.length, 'rows');
        process.exit(0);
    } catch (err) {
        console.error('Query Failed:', err.message);
        process.exit(1);
    }
}

test();
