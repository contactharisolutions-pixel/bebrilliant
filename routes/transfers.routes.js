// routes/transfers.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/transfers — List all stock transfers
router.get('/', auth, async (req, res) => {
    const { business_id, status, from_date, to_date, showroom_id, q } = req.query;
    const bid = business_id || req.user.business_id;
    
    try {
        let query = `
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
        const params = [bid];
        let idx = 2;

        if (status) {
            query += ` AND t.status = $${idx++}`;
            params.push(status);
        }
        if (showroom_id) {
            query += ` AND (t.from_showroom_id = $${idx} OR t.to_showroom_id = $${idx})`;
            params.push(showroom_id);
            idx++;
        }
        if (q) {
            query += ` AND (p.product_name ILIKE $${idx} OR v.sku ILIKE $${idx} OR t.transfer_id ILIKE $${idx})`;
            params.push(`%${q}%`);
            idx++;
        }
        if (from_date) {
            query += ` AND t.created_at >= $${idx++}`;
            params.push(from_date);
        }
        if (to_date) {
            query += ` AND t.created_at <= $${idx++}`;
            params.push(to_date + ' 23:59:59');
        }

        query += ` ORDER BY t.created_at DESC`;

        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/transfers — Create a new transfer request
router.post('/', auth, async (req, res) => {
    const { product_id, variant_id, from_showroom_id, to_showroom_id, quantity } = req.body;
    const business_id = req.user.business_id;
    const transfer_id = `trn_${Date.now()}`;

    if (!from_showroom_id || !to_showroom_id || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid transfer details' });
    }

    try {
        await db.query('BEGIN');

        // 1. Check source stock
        const stock = await db.query(
            `SELECT available_qty FROM inventory WHERE variant_id = $1 AND showroom_id = $2 AND business_id = $3`,
            [variant_id, from_showroom_id, business_id]
        );

        if (!stock.rows.length || stock.rows[0].available_qty < quantity) {
            await db.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Insufficient stock at source location' });
        }

        // 2. Create transfer record
        await db.query(
            `INSERT INTO stock_transfer (transfer_id, business_id, product_id, variant_id, from_showroom_id, to_showroom_id, quantity, requested_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [transfer_id, business_id, product_id, variant_id, from_showroom_id, to_showroom_id, quantity, req.user.id]
        );

        // Notify
        await db.query(`
            INSERT INTO system_notifications (notification_id, business_id, type, title, message, reference_id)
            VALUES ($1, $2, 'transfer', 'New Transfer Request', $3, $4)
        `, [`notif_${Date.now()}_req`, business_id, `Request for ${quantity} units of ${product_id}.`, transfer_id]);


        await db.query('COMMIT');
        res.status(201).json({ success: true, transfer_id });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/transfers/:id/status — Update transfer status (Ship, Receive, Cancel)
router.put('/:id/status', auth, async (req, res) => {
    const { status } = req.body;
    const transfer_id = req.params.id;
    const business_id = req.user.business_id;

    try {
        await db.query('BEGIN');

        // 1. Get transfer details
        const t = await db.query(
            `SELECT * FROM stock_transfer WHERE transfer_id = $1 AND business_id = $2`,
            [transfer_id, business_id]
        );

        if (!t.rows.length) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Transfer not found' });
        }

        const transfer = t.rows[0];

        // 2. Business logic for status changes
        if (status === 'Received' && transfer.status !== 'Received') {
            // Deduct from source
            await db.query(
                `UPDATE inventory SET available_qty = available_qty - $1, last_updated = NOW()
                 WHERE variant_id = $2 AND showroom_id = $3 AND business_id = $4`,
                [transfer.quantity, transfer.variant_id, transfer.from_showroom_id, business_id]
            );

            // Add to destination (Upsert)
            const destStock = await db.query(
                `SELECT inventory_id FROM inventory WHERE variant_id = $1 AND showroom_id = $2 AND business_id = $3`,
                [transfer.variant_id, transfer.to_showroom_id, business_id]
            );

            if (destStock.rows.length) {
                await db.query(
                    `UPDATE inventory SET available_qty = available_qty + $1, last_updated = NOW()
                     WHERE variant_id = $2 AND showroom_id = $3 AND business_id = $4`,
                    [transfer.quantity, transfer.variant_id, transfer.to_showroom_id, business_id]
                );
            } else {
                await db.query(
                    `INSERT INTO inventory (inventory_id, business_id, product_id, variant_id, showroom_id, available_qty)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [`inv_${Date.now()}`, business_id, transfer.product_id, transfer.variant_id, transfer.to_showroom_id, transfer.quantity]
                );
            }
        }

        // 3. Update status
        await db.query(
            `UPDATE stock_transfer SET status = $1 WHERE transfer_id = $2`,
            [status, transfer_id]
        );

        // Notify
        await db.query(`
            INSERT INTO system_notifications (notification_id, business_id, type, title, message, reference_id)
            VALUES ($1, $2, 'transfer', 'Transfer Status Updated', $3, $4)
        `, [`notif_${Date.now()}_upd`, business_id, `Transfer ${transfer_id} is now ${status}.`, transfer_id]);


        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/transfers/stats — Summary for dashboard
router.get('/stats', auth, async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const { rows } = await db.query(
            `SELECT status, COUNT(*) as count 
             FROM stock_transfer 
             WHERE business_id = $1 
             GROUP BY status`,
            [business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/transfers/:id/print — Generate Waybill (Stock Transfer Doc)
const PDFDocument = require('pdfkit');

router.get('/:id/print', auth, async (req, res) => {
    const { id } = req.params;
    const business_id = req.user.business_id;

    try {
        // 1. Fetch data
        const tRes = await db.query(`
            SELECT t.*, 
                   p.product_name, v.sku, v.barcode,
                   fs.showroom_name as from_name, fs.address as from_address, fs.gstin as from_gstin, fs.mobile as from_mobile,
                   ts.showroom_name as to_name, ts.address as to_address, ts.gstin as to_gstin, ts.mobile as to_mobile,
                   b.title as business_title, b.logo_url
            FROM stock_transfer t
            JOIN product p ON t.product_id = p.product_id
            JOIN variant v ON t.variant_id = v.variant_id
            LEFT JOIN showroom fs ON t.from_showroom_id = fs.showroom_id
            LEFT JOIN showroom ts ON t.to_showroom_id = ts.showroom_id
            JOIN business b ON t.business_id = b.business_id
            WHERE t.transfer_id = $1 AND t.business_id = $2
        `, [id, business_id]);

        if (!tRes.rows.length) return res.status(404).send('Transfer record not found');
        const t = tRes.rows[0];

        // 2. Create PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Waybill-${id}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(t.business_title, { align: 'center' });
        doc.fontSize(10).text('INTERNAL STOCK TRANSFER WAYBILL', { align: 'center', color: '#64748b' });
        doc.moveDown(2);

        doc.fontSize(12).text(`Waybill No: ${t.transfer_id}`, { bold: true });
        doc.fontSize(10).text(`Date: ${new Date(t.created_at).toLocaleString()}`);
        doc.text(`Status: ${t.status}`);
        doc.moveDown();

        const top = doc.y;
        // From Location
        doc.fontSize(11).text('FROM (SOURCE):', 50, top, { underline: true });
        doc.fontSize(10).text(t.from_name || 'Warehouse / Main');
        doc.text(t.from_address || 'Internal Stock');
        doc.text(`GSTIN: ${t.from_gstin || 'N/A'}`);

        // To Location
        doc.fontSize(11).text('TO (DESTINATION):', 300, top, { underline: true });
        doc.fontSize(10).text(t.to_name);
        doc.text(t.to_address || 'N/A');
        doc.text(`GSTIN: ${t.to_gstin || 'N/A'}`);
        doc.moveDown(2);

        // Item Details
        doc.rect(50, doc.y, 500, 25).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(10).text('Item Description', 60, doc.y + 7);
        doc.text('SKU / Barcode', 250, doc.y - 12);
        doc.text('Quantity', 450, doc.y - 12);

        doc.moveDown(0.5);
        doc.fillColor('black');
        const itemY = doc.y + 10;
        doc.text(t.product_name, 60, itemY);
        doc.text(`${t.sku || ''} ${t.barcode ? '/ ' + t.barcode : ''}`, 250, itemY);
        doc.fontSize(14).text(t.quantity.toString(), 450, itemY, { bold: true });

        doc.moveDown(4);
        
        // Signatures
        const sigY = doc.y;
        doc.fontSize(10).text('_________________________', 50, sigY);
        doc.text('Authorized Signatory (From)', 50, sigY + 15);

        doc.text('_________________________', 350, sigY);
        doc.text('Receiver Signatory (To)', 350, sigY + 15);

        // Footer
        doc.fontSize(8).fillColor('#94a3b8').text('Generated by BlinkOpticals ERP Hub', 50, doc.page.height - 50, { align: 'center' });

        doc.end();

    } catch (err) {
        console.error('Waybill Gen Error:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

module.exports = router;
