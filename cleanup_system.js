/**
 * BlinkOpticals — Transaction Cleanup Script
 * Wipes all historical transaction data (orders, payments, movements)
 * but keeps master data (products, brands, etc.) and current inventory levels intact.
 */
require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');

async function cleanup() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        console.log('--- STARTING TRANSACTION CLEANUP ---');
        await client.query('BEGIN');

        // 1. Delete Payments
        const p = await client.query('DELETE FROM payment');
        console.log(`✓ Deleted ${p.rowCount} payment records`);

        // 2. Delete Order Items
        const oi = await client.query('DELETE FROM order_item');
        console.log(`✓ Deleted ${oi.rowCount} order items`);

        // 3. Delete Orders
        const o = await client.query('DELETE FROM customer_order');
        console.log(`✓ Deleted ${o.rowCount} historical orders`);

        // 4. Delete Stock Movements
        const sm = await client.query('DELETE FROM stock_movement');
        console.log(`✓ Deleted ${sm.rowCount} stock movement logs`);

        // 5. Optional: Clear Customer interaction logs if any (e.g. notifications)
        const n = await client.query('DELETE FROM app_notification');
        console.log(`✓ Deleted ${n.rowCount} system notifications`);

        await client.query('COMMIT');
        console.log('--- CLEANUP COMPLETE (INTEGRITY MAINTAINED) ---');
        console.log('Master data (Products, Brands, Showrooms) remains untouched.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(' Cleanup Failed:', err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

cleanup();
