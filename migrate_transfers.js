// migrate_transfers.js
const db = require('./db');

async function migrate() {
    try {
        console.log('--- Migrating Stock Transfers Table ---');
        await db.query(`DROP TABLE IF EXISTS stock_transfer CASCADE`);
        await db.query(`
            CREATE TABLE stock_transfer (
                transfer_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50) REFERENCES business(business_id),
                product_id VARCHAR(50) REFERENCES product(product_id),
                variant_id VARCHAR(50) REFERENCES variant(variant_id),
                from_showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
                to_showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
                quantity INT NOT NULL,
                status VARCHAR(50) CHECK (status IN ('Pending', 'Shipped', 'Received', 'Cancelled')) DEFAULT 'Pending',
                requested_by VARCHAR(50) REFERENCES app_user(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Success: stock_transfer table created.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
