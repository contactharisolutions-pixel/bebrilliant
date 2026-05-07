// routes/inventory.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/inventory — stock across showrooms/warehouses
router.get('/', auth, async (req, res) => {
    const { business_id, showroom_id, warehouse_id, low_stock, brand_id, category_id, q, from_date, to_date } = req.query;
    const biz = business_id || req.user.business_id;

    try {
        // Build params for the proxy — it handles all enrichment in-memory
        const queryParams = [biz];
        if (showroom_id)  queryParams.push(showroom_id);
        if (brand_id)     queryParams.push(brand_id);
        if (q)            queryParams.push(`%${q}%`);

        // Simple query — proxy Inventory Handler does all joins
        let sqlStr = `SELECT * FROM inventory WHERE business_id = $1`;
        if (low_stock === 'true') sqlStr += ` AND available_qty <= 5`;

        const { rows: allRows } = await db.query(sqlStr, [biz]);

        // JS-side filter (proxy already does most enrichment)
        let rows = allRows;
        if (showroom_id)         rows = rows.filter(i => i.showroom_id === showroom_id);
        if (warehouse_id)        rows = rows.filter(i => i.warehouse_id === warehouse_id);
        if (brand_id)            rows = rows.filter(i => i.brand_id === brand_id);
        if (category_id)         rows = rows.filter(i => i.category_id === category_id);
        if (low_stock === 'true') rows = rows.filter(i => (i.available_qty || 0) <= 5);
        if (from_date)           rows = rows.filter(i => new Date(i.last_updated) >= new Date(from_date));
        if (to_date)             rows = rows.filter(i => new Date(i.last_updated) <= new Date(to_date + ' 23:59:59'));
        if (q) {
            const t = q.toLowerCase();
            rows = rows.filter(i =>
                (i.sku          || '').toLowerCase().includes(t) ||
                (i.product_name || '').toLowerCase().includes(t) ||
                (i.brand_name   || '').toLowerCase().includes(t) ||
                (i.color_code   || '').toLowerCase().includes(t) ||
                (i.model_no     || '').toLowerCase().includes(t)
            );
        }

        res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error('[inventory GET error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// POST /api/inventory/variant — Create variant + Initialize Stock
router.post('/variant', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { product_id, sku, barcode, frame_color_id, lens_color_id, weight, image_url, initial_stock } = req.body;
    const business_id = req.user.business_id;
    const vid = `var_${Date.now()}`;

    try {
        await db.query('BEGIN');

        // 1. Create Variant
        await db.query(
            `INSERT INTO variant (variant_id, product_id, sku, barcode, frame_color_id, lens_color_id, weight, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [vid, product_id, sku, barcode, frame_color_id, lens_color_id, weight, image_url]
        );

        // 2. Initialize Stock (Pick first location if not provided)
        const loc = await db.query(`SELECT showroom_id as id FROM showroom WHERE business_id = $1 LIMIT 1`, [business_id]);
        const locId = loc.rows[0]?.id;

        if (locId) {
            await db.query(
                `INSERT INTO inventory (inventory_id, business_id, product_id, variant_id, showroom_id, available_qty)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [`inv_${Date.now()}`, business_id, product_id, vid, locId, initial_stock || 0]
            );
        }

        await db.query('COMMIT');
        res.status(201).json({ success: true, variant_id: vid });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});


// POST /api/inventory/adjust — manual stock adjustment
router.post('/adjust', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, variant_id, showroom_id, warehouse_id, adjustment, reason } = req.body;
    try {
        await db.query(
            `UPDATE inventory SET available_qty = available_qty + $1, last_updated = NOW()
             WHERE variant_id = $2 AND (showroom_id = $3 OR warehouse_id = $4)`,
            [adjustment, variant_id, showroom_id, warehouse_id]
        );
        // Log the adjustment
        const { rows } = await db.query(`SELECT product_id FROM variant WHERE variant_id = $1`, [variant_id]);
        await db.query(
            `INSERT INTO stock_movement (movement_id, business_id, product_id, variant_id, from_location, quantity, movement_type)
             VALUES ($1,$2,$3,$4,$5,$6,'Transfer')`,
            [`smv_${Date.now()}`, business_id, rows[0]?.product_id, variant_id, showroom_id || warehouse_id, Math.abs(adjustment)]
        );
        res.json({ success: true, message: 'Stock adjusted' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Stock adjustment failed' });
    }
});

// POST /api/inventory/transfer — Request a new stock transfer
router.post('/transfer', auth, rbac('Admin', 'Manager', 'Warehouse Staff'), async (req, res) => {
    const { product_id, variant_id, from_showroom_id, to_showroom_id, quantity } = req.body;
    const tid = `TRF_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO stock_transfer (transfer_id, business_id, product_id, variant_id, from_showroom_id, to_showroom_id, quantity, requested_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [tid, req.user.business_id, product_id, variant_id, from_showroom_id, to_showroom_id, quantity, req.user.id]
        );
        res.json({ success: true, message: 'Transfer request created', transfer_id: tid });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to create transfer' });
    }
});

// GET /api/inventory/transfer/list — View transfers
router.get('/transfer/list', auth, async (req, res) => {
    const { business_id } = req.query;
    try {
        const { rows } = await db.query(
            `SELECT t.*, p.product_name, v.sku, fs.showroom_name as from_name, ts.showroom_name as to_name
             FROM stock_transfer t
             JOIN product p ON t.product_id = p.product_id
             JOIN variant v ON t.variant_id = v.variant_id
             JOIN showroom fs ON t.from_showroom_id = fs.showroom_id
             JOIN showroom ts ON t.to_showroom_id = ts.showroom_id
             WHERE t.business_id = $1
             ORDER BY t.created_at DESC`,
            [business_id || req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch transfers' });
    }
});

// POST /api/inventory/transfer/receive — Complete a transfer
router.post('/transfer/receive', auth, rbac('Admin', 'Manager', 'Warehouse Staff'), async (req, res) => {
    const { transfer_id } = req.body;
    try {
        // 1. Get transfer details
        const { rows } = await db.query(`SELECT * FROM stock_transfer WHERE transfer_id = $1`, [transfer_id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Transfer not found' });
        const tr = rows[0];
        if (tr.status === 'Received') return res.status(400).json({ success: false, error: 'Already received' });

        // 2. Start Transaction
        await db.query('BEGIN');
        
        // Update source: Deduct
        await db.query(`UPDATE inventory SET available_qty = available_qty - $1 WHERE variant_id = $2 AND showroom_id = $3`, [tr.quantity, tr.variant_id, tr.from_showroom_id]);
        
        // Update destination: Add (Upsert)
        const checkDest = await db.query(`SELECT 1 FROM inventory WHERE variant_id = $1 AND showroom_id = $2`, [tr.variant_id, tr.to_showroom_id]);
        if (checkDest.rows.length === 0) {
            await db.query(`INSERT INTO inventory (inventory_id, business_id, product_id, variant_id, showroom_id, available_qty) VALUES ($1,$2,$3,$4,$5,$6)`, 
                [`inv_${Date.now()}`, tr.business_id, tr.product_id, tr.variant_id, tr.to_showroom_id, tr.quantity]);
        } else {
            await db.query(`UPDATE inventory SET available_qty = available_qty + $1 WHERE variant_id = $2 AND showroom_id = $3`, [tr.quantity, tr.variant_id, tr.to_showroom_id]);
        }

        // Finalize Transfer status
        await db.query(`UPDATE stock_transfer SET status = 'Received' WHERE transfer_id = $1`, [transfer_id]);
        
        await db.query('COMMIT');
        res.json({ success: true, message: 'Transfer completed and inventory updated' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: 'Failed to process transfer' });
    }
});

module.exports = router;

