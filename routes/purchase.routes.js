// routes/purchase.routes.js — Purchase & Vendor Management
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// ── VENDORS ──────────────────────────────────────────────────────────

router.get('/vendors', auth, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM vendors WHERE business_id = $1 ORDER BY name', [req.user.business_id]);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/vendors', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { name, contact_person, mobile, email, gstin, address } = req.body;
    const vendor_id = `vnd_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO vendors (vendor_id, business_id, name, contact_person, mobile, email, gstin, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [vendor_id, req.user.business_id, name, contact_person, mobile, email, gstin, address]
        );
        res.json({ success: true, vendor_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── PURCHASE ORDERS ───────────────────────────────────────────────────

router.get('/orders', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT po.*, v.name as vendor_name 
             FROM purchase_orders po 
             JOIN vendors v ON po.vendor_id = v.vendor_id 
             WHERE po.business_id = $1 ORDER BY po.order_date DESC`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/purchase/orders — Create PO
router.post('/orders', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { vendor_id, items, showroom_id, notes } = req.body;
    const business_id = req.user.business_id;
    const purchase_id = `PO-${Date.now()}`;

    try {
        await db.query('BEGIN');
        
        let total = 0;
        for(let itm of items) total += (itm.qty * itm.cost);

        await db.query(
            `INSERT INTO purchase_orders (purchase_id, business_id, vendor_id, showroom_id, total_amount, status)
             VALUES ($1, $2, $3, $4, $5, 'Draft')`,
            [purchase_id, business_id, vendor_id, showroom_id, total]
        );

        for (let itm of items) {
            await db.query(
                `INSERT INTO purchase_items (purchase_id, product_id, variant_id, quantity, unit_cost, total_amount)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [purchase_id, itm.product_id, itm.variant_id, itm.qty, itm.cost, itm.qty * itm.cost]
            );
        }

        await db.query('COMMIT');
        res.json({ success: true, purchase_id });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/purchase/receive — Receive Stock & Update Inventory
router.post('/receive', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { purchase_id } = req.body;
    const business_id = req.user.business_id;

    try {
        await db.query('BEGIN');

        // 1. Get PO Details
        const poRes = await db.query('SELECT * FROM purchase_orders WHERE purchase_id = $1 AND business_id = $2', [purchase_id, business_id]);
        if (poRes.rows[0].status === 'Received') throw new Error('Already received');
        
        const po = poRes.rows[0];
        const { rows: items } = await db.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [purchase_id]);

        // 2. Update Inventory
        for (let itm of items) {
            const invId = `inv_purchase_${Date.now()}_${itm.item_id}`;
            await db.query(
                `INSERT INTO inventory (inventory_id, business_id, product_id, variant_id, showroom_id, available_qty)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (business_id, variant_id, showroom_id) 
                 DO UPDATE SET available_qty = inventory.available_qty + $6`,
                [invId, business_id, itm.product_id, itm.variant_id, po.showroom_id, itm.quantity]
            );
        }

        // 3. Update PO Status
        await db.query('UPDATE purchase_orders SET status = $1 WHERE purchase_id = $2', ['Received', purchase_id]);

        // 4. Accounting Entry (Inventory Debit, Vendor Credit)
        const journal_id = `jrnl_pur_${Date.now()}`;
        await db.query(
            `INSERT INTO journal_entries (journal_id, business_id, date, reference_type, reference_id, total_amount, notes)
             VALUES ($1, $2, CURRENT_DATE, 'purchase', $3, $4, $5)`,
            [journal_id, business_id, purchase_id, po.total_amount, `Purchase from Vendor ID: ${po.vendor_id}`]
        );

        // Debit: Inventory Asset (acc_inventory_001)
        await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_inventory_001', $2, 0)`, [journal_id, po.total_amount]);
        // Credit: Accounts Payable (acc_creditors_001)
        await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_creditors_001', 0, $2)`, [journal_id, po.total_amount]);

        await db.query('COMMIT');
        res.json({ success: true, message: 'Stock received and inventory updated' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/purchase/orders/:id/print — Generate PDF Purchase Order
const PDFDocument = require('pdfkit');

router.get('/orders/:id/print', auth, async (req, res) => {
    const { id } = req.params;
    const business_id = req.user.business_id;

    try {
        // 1. Fetch data
        const poRes = await db.query(`
            SELECT po.*, v.name as vendor_name, v.address as vendor_address, v.gstin as vendor_gstin, v.mobile as vendor_mobile,
                   s.showroom_name, s.address as showroom_address, s.gstin as showroom_gstin,
                   b.logo_url, b.gstin_main as main_gstin, b.title as business_title
            FROM purchase_orders po
            JOIN vendors v ON po.vendor_id = v.vendor_id
            JOIN showroom s ON po.showroom_id = s.showroom_id
            JOIN business b ON po.business_id = b.business_id
            WHERE po.purchase_id = $1 AND po.business_id = $2
        `, [id, business_id]);

        if (!poRes.rows.length) return res.status(404).send('Purchase Order not found');
        const po = poRes.rows[0];

        const { rows: items } = await db.query(`
            SELECT pi.*, p.product_name, p.sku
            FROM purchase_items pi
            JOIN products p ON pi.product_id = p.product_id
            WHERE pi.purchase_id = $1
        `, [id]);

        // 2. Create PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=PO-${id}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(po.business_title, { align: 'left' });
        doc.fontSize(10).text('Enterprise Optical Solutions', { align: 'left' });
        doc.moveDown();

        doc.fontSize(16).text('PURCHASE ORDER', { align: 'right' });
        doc.fontSize(10).text(`PO Number: ${po.purchase_id}`, { align: 'right' });
        doc.text(`Date: ${new Date(po.order_date).toLocaleDateString()}`, { align: 'right' });
        doc.text(`Status: ${po.status}`, { align: 'right' });
        doc.moveDown(2);

        const top = doc.y;
        // Vendor Info
        doc.fontSize(12).text('VENDOR:', 50, top, { underline: true });
        doc.fontSize(10).text(po.vendor_name);
        doc.text(po.vendor_address || 'N/A');
        doc.text(`GSTIN: ${po.vendor_gstin || 'N/A'}`);
        doc.text(`Contact: ${po.vendor_mobile || 'N/A'}`);

        // Ship To
        doc.fontSize(12).text('SHIP TO:', 300, top, { underline: true });
        doc.fontSize(10).text(po.showroom_name);
        doc.text(po.showroom_address || 'N/A');
        doc.text(`GSTIN: ${po.showroom_gstin || 'N/A'}`);
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y + 20;
        doc.rect(50, tableTop, 500, 20).fill('#f1f5f9').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(10).text('Product Description', 60, tableTop + 5);
        doc.text('SKU', 250, tableTop + 5);
        doc.text('Qty', 350, tableTop + 5);
        doc.text('Unit Cost', 410, tableTop + 5);
        doc.text('Total', 480, tableTop + 5);

        // Table Rows
        let rowTop = tableTop + 20;
        doc.fillColor('black');
        items.forEach(itm => {
            doc.text(itm.product_name, 60, rowTop + 5, { width: 180 });
            doc.text(itm.sku || '-', 250, rowTop + 5);
            doc.text(itm.quantity.toString(), 350, rowTop + 5);
            doc.text(`₹${itm.unit_cost.toLocaleString()}`, 410, rowTop + 5);
            doc.text(`₹${itm.total_amount.toLocaleString()}`, 480, rowTop + 5);
            rowTop += 20;
            doc.moveTo(50, rowTop).lineTo(550, rowTop).stroke('#f1f5f9');
        });

        // Summary
        doc.moveDown();
        doc.fontSize(12).text(`Grand Total: ₹${po.total_amount.toLocaleString()}`, { align: 'right', bold: true });

        // Footer
        const bottom = doc.page.height - 100;
        doc.fontSize(9).fillColor('#64748b').text('Terms & Conditions:', 50, bottom);
        doc.text('1. Please include the PO number on all invoices and shipping documents.');
        doc.text('2. All items are subject to inspection and approval upon delivery.');
        doc.text('3. This is a computer-generated document and does not require a physical signature.', { align: 'center', margin: 20 });

        doc.end();

    } catch (err) {
        console.error('PDF Gen Error:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

module.exports = router;
