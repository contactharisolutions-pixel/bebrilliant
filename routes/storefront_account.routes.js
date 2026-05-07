const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// In-memory OTP store (Use Redis for production)
const otpStore = new Map();

// Authentication middleware specifically for storefront customers
const customerAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err || user.role !== 'customer') return res.status(403).json({ success: false, error: 'Invalid Session' });
        req.user = user;
        next();
    });
};

router.post('/send-otp', async (req, res) => {
    try {
        const { mobile, name } = req.body;
        if (!mobile) return res.status(400).json({ success: false, error: 'Mobile number required' });
        
        // 1. Generate OTP (Static 1234 for dev/demo)
        const otp = '1234'; 
        
        // 2. Store OTP temporarily (Expiry: 5 mins)
        otpStore.set(mobile, { otp, name, expiresAt: Date.now() + 5 * 60 * 1000 });
        
        // TODO: Integrate actual SMS gateway here 

        res.json({ success: true, message: 'OTP sent successfully (Use 1234 for demo)' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const record = otpStore.get(mobile);

        if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        // Clean up OTP
        otpStore.delete(mobile);

        // Check if customer exists in business (Hardcoded to default business for storefront demo)
        const default_business = 'biz_blink_001';
        let { rows } = await db.query('SELECT * FROM customers WHERE mobile = $1 AND business_id = $2', [mobile, default_business]);
        
        let customer;
        if (rows.length === 0) {
            // Auto Sign Up
            const customer_id = 'cust_' + Date.now();
            const insert = await db.query(
                'INSERT INTO customers (id, business_id, full_name, mobile) VALUES ($1, $2, $3, $4) RETURNING *',
                [customer_id, default_business, record.name || 'Valued Customer', mobile]
            );
            customer = insert.rows[0];
        } else {
            customer = rows[0];
        }

        // Generate JWT
        const token = jwt.sign(
            { id: customer.id, mobile: customer.mobile, role: 'customer' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({ success: true, token, customer });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/profile', customerAuth, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, full_name, mobile, email FROM customers WHERE id = $1', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Customer not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/orders', customerAuth, async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT order_id, order_date, total_amount, status 
            FROM orders 
            WHERE customer_id = $1 
            ORDER BY order_date DESC LIMIT 20
        `, [req.user.id]);
        res.json({ success: true, data: rows });
    } catch (err) { 
        res.json({ success: true, data: [] }); 
    }
});

// ─── WISHLIST ENDPOINTS ───
// Auto-create table safely
const initWishlistTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS storefront_wishlist (
                id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                customer_id VARCHAR(50),
                product_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(customer_id, product_id)
            );
        `);
    } catch(e) {}
};
initWishlistTable();

router.get('/wishlist', customerAuth, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT product_id FROM storefront_wishlist WHERE customer_id = $1', [req.user.id]);
        res.json({ success: true, data: rows.map(r => r.product_id) });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── ORDER MANAGEMENT ───
const initOrdersTables = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                customer_id VARCHAR(50),
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_amount DECIMAL(10,2),
                gst_amount DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                payment_id VARCHAR(100),
                shipping_address TEXT,
                billing_address TEXT,
                customer_mobile VARCHAR(20),
                coupon_code VARCHAR(50),
                prescription_data TEXT
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50) REFERENCES orders(order_id),
                product_id VARCHAR(50),
                product_name TEXT,
                qty INTEGER,
                price DECIMAL(10,2)
            );
        `);
    } catch(e) { console.error('Orders Table Init Error', e); }
};
initOrdersTables();

router.post('/orders/create', customerAuth, async (req, res) => {
    try {
        const { cart, address, billingAddress, mobile, prescription, coupon_code, gst_amount, discount_amount, total_amount } = req.body;
        const cust_id = req.user.id;
        const biz_id = 'biz_blink_001';
        const order_id = 'ORD_' + Date.now();
        
        // Final sanity check for total
        const calc_total = total_amount || cart.reduce((s, i) => s + (i.price * i.qty), 0);

        // 1. Create Main Order
        await db.query(
            `INSERT INTO orders (order_id, business_id, customer_id, total_amount, gst_amount, discount_amount, status, shipping_address, billing_address, customer_mobile, coupon_code, prescription_data) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [order_id, biz_id, cust_id, calc_total, gst_amount || 0, discount_amount || 0, 'pending', address, billingAddress || address, mobile, coupon_code || null, prescription ? JSON.stringify(prescription) : null]
        );

        // 2. Create Order Items
        for (const item of cart) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, product_name, qty, price) VALUES ($1,$2,$3,$4,$5)',
                [order_id, item.id, item.name, item.qty, item.price]
            );
        }

        res.json({ success: true, order_id, total: calc_total });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/orders/verify-payment', customerAuth, async (req, res) => {
    try {
        const { order_id, payment_id } = req.body;
        await db.query('UPDATE orders SET status = $1, payment_id = $2 WHERE order_id = $3', ['confirmed', payment_id, order_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/wishlist/toggle', customerAuth, async (req, res) => {
    // ... preserved ...
    try {
        const { product_id, business_id } = req.body;
        const cust_id = req.user.id;
        const biz_id = business_id || 'biz_blink_001';

        const { rows } = await db.query('SELECT id FROM storefront_wishlist WHERE customer_id=$1 AND product_id=$2', [cust_id, product_id]);
        
        let added = false;
        if (rows.length > 0) {
            await db.query('DELETE FROM storefront_wishlist WHERE id=$1', [rows[0].id]);
        } else {
            const id = 'wlist_' + Date.now();
            await db.query('INSERT INTO storefront_wishlist (id, business_id, customer_id, product_id) VALUES ($1,$2,$3,$4)', [id, biz_id, cust_id, product_id]);
            added = true;
        }

        res.json({ success: true, added });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
