const db = require('./db');

async function migrate() {
    try {
        console.log('--- Migrating Purchase & Vendor Management Tables ---');
        
        // 1. Vendors Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS vendors (
                vendor_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50) REFERENCES business(business_id),
                name VARCHAR(100) NOT NULL,
                contact_person VARCHAR(100),
                mobile VARCHAR(20),
                email VARCHAR(100),
                gstin VARCHAR(20),
                address TEXT,
                active_status BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Purchase Orders Table
        // Status: Draft, Ordered, Partial, Received, Cancelled
        await db.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                purchase_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50) REFERENCES business(business_id),
                vendor_id VARCHAR(50) REFERENCES vendors(vendor_id),
                showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
                order_date DATE DEFAULT CURRENT_DATE,
                total_amount DECIMAL(15,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Draft',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Purchase Items Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                item_id SERIAL PRIMARY KEY,
                purchase_id VARCHAR(50) REFERENCES purchase_orders(purchase_id) ON DELETE CASCADE,
                product_id VARCHAR(50) REFERENCES product(product_id),
                variant_id VARCHAR(50) REFERENCES variant(variant_id),
                quantity INT NOT NULL,
                unit_cost DECIMAL(15,2) NOT NULL,
                total_amount DECIMAL(15,2) NOT NULL
            )
        `);

        console.log('Success: Purchase module tables are ready.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
