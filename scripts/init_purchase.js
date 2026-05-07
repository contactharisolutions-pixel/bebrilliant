/**
 * Initialize Purchase Module Tables
 */
const { Pool } = require('pg');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const schema = `
-- 1. Vendors
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    mobile TEXT,
    email TEXT,
    gstin TEXT,
    address TEXT,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    purchase_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    vendor_id TEXT REFERENCES vendors(vendor_id),
    showroom_id TEXT, -- Where stock will be delivered
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Ordered', 'Received', 'Cancelled')),
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Paid')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    item_id SERIAL PRIMARY KEY,
    purchase_id TEXT REFERENCES purchase_orders(purchase_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    quantity INTEGER NOT NULL,
    received_qty INTEGER DEFAULT 0,
    unit_cost DECIMAL(15,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL
);

-- 4. Vendor Payments
CREATE TABLE IF NOT EXISTS vendor_payments (
    payment_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    purchase_id TEXT REFERENCES purchase_orders(purchase_id),
    vendor_id TEXT REFERENCES vendors(vendor_id),
    amount DECIMAL(15,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payment_mode TEXT,
    reference_no TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function init() {
    try {
        console.log('--- Initializing Purchase Schema ---');
        await pool.query(schema);
        console.log('Purchase tables initialized.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to init purchase schema:', err.message);
        process.exit(1);
    }
}

init();
