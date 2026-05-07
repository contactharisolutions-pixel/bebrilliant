// routes/customers.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/customers — list customers with advanced filters
router.get('/', auth, async (req, res) => {
    const { business_id, search, tier, city, signup_from, signup_to, limit = 20, offset = 0 } = req.query;
    const biz = business_id || req.user.business_id;
    try {
        // Proxy v48 Customer Handler returns enriched rows with order_count, lifetime_value, tier, points
        const { rows: allRows } = await db.query(
            `SELECT * FROM customer WHERE business_id = $1 ORDER BY created_at DESC`,
            [biz]
        );

        let rows = allRows;
        if (search)      { const t = search.toLowerCase(); rows = rows.filter(c => (c.name || '').toLowerCase().includes(t) || (c.mobile || '').includes(t) || (c.email || '').toLowerCase().includes(t)); }
        if (tier)        rows = rows.filter(c => c.tier === tier);
        if (city)        rows = rows.filter(c => (c.city || '').toLowerCase().includes(city.toLowerCase()));
        if (signup_from) rows = rows.filter(c => new Date(c.created_at) >= new Date(signup_from));
        if (signup_to)   rows = rows.filter(c => new Date(c.created_at) <= new Date(signup_to));

        const lim = parseInt(limit); const off = parseInt(offset);
        res.json({ success: true, data: rows.slice(off, off + lim), total: rows.length });
    } catch (err) {
        console.error('[customer list error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch customers' });
    }
});


// GET /api/customers/kpis — aggregated metrics for dashboard
router.get('/kpis', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    try {
        const [total, newThisMonth, highValue] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM customer WHERE business_id = $1`, [business_id]),
            db.query(`SELECT COUNT(*) FROM customer WHERE business_id = $1 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`, [business_id]),
            db.query(`
                SELECT COUNT(DISTINCT co.customer_id) 
                FROM customer_order co 
                WHERE co.business_id = $1 
                GROUP BY co.customer_id HAVING SUM(co.total_amount) > 50000
            `, [business_id])
        ]);

        res.json({
            success: true,
            data: {
                totalCustomers: parseInt(total.rows[0].count),
                newCustomers: parseInt(newThisMonth.rows[0].count),
                highValueCustomers: highValue.rows.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/customers/bulk — Process bulk import
router.post('/bulk', auth, async (req, res) => {
    const { customers } = req.body; // Array of customer objects
    const business_id = req.user.business_id;
    
    if (!Array.isArray(customers)) return res.status(400).json({ success: false, error: 'Invalid data format' });

    try {
        await db.query('BEGIN');
        let imported = 0;
        let skipped = 0;

        for (const c of customers) {
            // Basic validation
            if (!c.name || !c.mobile) { skipped++; continue; }

            const cid = `cust_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            
            try {
                await db.query(
                    `INSERT INTO customer (customer_id, business_id, name, mobile, email, city, gender, date_of_birth, notes)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                     ON CONFLICT (mobile) DO NOTHING`,
                    [cid, business_id, c.name, c.mobile, c.email || null, c.city || null, c.gender || null, c.date_of_birth || null, c.notes || null]
                );
                
                // If inserted, create loyalty
                await db.query(
                    `INSERT INTO loyalty (loyalty_id, business_id, customer_id, points, tier) 
                     VALUES ($1,$2,$3,0,'Silver')
                     ON CONFLICT DO NOTHING`,
                    [`loy_${Date.now()}_${imported}`, business_id, cid]
                );
                imported++;
            } catch (e) {
                skipped++;
            }
        }
        await db.query('COMMIT');
        res.json({ success: true, imported, skipped });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/customers/:id — 360° profile with timeline
router.get('/:id', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.*, l.tier, l.points FROM customer c
             LEFT JOIN loyalty l ON l.customer_id = c.customer_id
             WHERE c.customer_id = $1`, [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, error: 'Customer not found' });

        const [orders, prescriptions, repairs, appointments] = await Promise.all([
            db.query(`SELECT order_id, invoice_number, total_amount, order_status, created_at FROM customer_order WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10`, [req.params.id]),
            db.query(`SELECT * FROM eye_test WHERE customer_id = $1 ORDER BY test_date DESC LIMIT 5`, [req.params.id]),
            db.query(`SELECT * FROM repair WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5`, [req.params.id]),
            db.query(`SELECT * FROM appointment WHERE customer_id = $1 ORDER BY appointment_date DESC LIMIT 5`, [req.params.id])
        ]);

        res.json({
            success: true,
            data: {
                ...rows[0],
                orders: orders.rows,
                prescriptions: prescriptions.rows,
                repairs: repairs.rows,
                appointments: appointments.rows
            }
        });
    } catch (err) {
        console.error('[customer profile error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch customer profile' });
    }
});

// POST /api/customers — create customer
router.post('/', auth, async (req, res) => {
    const { business_id, name, mobile, email, city, gender, date_of_birth, notes } = req.body;
    if (!name || !mobile) return res.status(400).json({ success: false, error: 'Name and mobile required' });

    const customer_id = `cust_${Date.now()}`;
    const bizId = business_id || req.user.business_id;

    // Fix: Handle empty strings as null for optional fields to avoid database type errors (especially for DATE column)
    const dob = (date_of_birth === '' || !date_of_birth) ? null : date_of_birth;
    const em = (email === '' || !email) ? null : email;
    const ct = (city === '' || !city) ? null : city;
    const gn = (gender === '' || !gender) ? null : gender;
    const nt = (notes === '' || !notes) ? null : notes;

    try {
        await db.query('BEGIN');
        await db.query(
            `INSERT INTO customer (customer_id, business_id, name, mobile, email, city, gender, date_of_birth, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [customer_id, bizId, name, mobile, em, ct, gn, dob, nt]
        );
        // Auto-create loyalty record
        await db.query(
            `INSERT INTO loyalty (loyalty_id, business_id, customer_id, points, tier) VALUES ($1,$2,$3,0,'Silver')`,
            [`loy_${Date.now()}`, bizId, customer_id]
        );
        await db.query('COMMIT');
        res.status(201).json({ success: true, customer_id });
    } catch (err) {
        await db.query('ROLLBACK');
        if (err.code === '23505') return res.status(409).json({ success: false, error: 'Customer with this mobile/email already exists' });
        res.status(500).json({ success: false, error: 'Failed to create customer' });
    }
});

// PUT /api/customers/:id
router.put('/:id', auth, async (req, res) => {
    const { name, mobile, email, city, gender, date_of_birth, notes } = req.body;
    
    // Convert empty strings to null for optional fields
    const dob = (date_of_birth === '' || !date_of_birth) ? null : date_of_birth;
    const em = (email === '' || !email) ? null : email;
    const ct = (city === '' || !city) ? null : city;
    const gn = (gender === '' || !gender) ? null : gender;
    const nt = (notes === '' || !notes) ? null : notes;

    try {
        await db.query(
            `UPDATE customer SET name=$1, mobile=$2, email=$3, city=$4, gender=$5, date_of_birth=$6, notes=$7 WHERE customer_id=$8`,
            [name, mobile, em, ct, gn, dob, nt, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Update failed' });
    }
});

module.exports = router;
