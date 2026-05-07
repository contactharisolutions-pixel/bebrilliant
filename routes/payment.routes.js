// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res) => {
    const { amount, order_id, currency = 'INR' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Valid amount required' });

    try {
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency,
            receipt: `rcpt_${order_id || Date.now()}`
        });
        res.json({ success: true, order: rzpOrder, key: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        console.error('[razorpay order error]', err);
        res.status(502).json({ success: false, error: 'Payment gateway error' });
    }
});

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, order_id, business_id } = req.body;

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    if (hmac.digest('hex') !== razorpay_signature)
        return res.status(400).json({ success: false, error: 'Payment signature verification failed' });

    try {
        await db.query('BEGIN');
        const payment_id = `pay_${Date.now()}`;
        await db.query(
            `INSERT INTO payment (payment_id, order_id, business_id, amount, payment_mode, transaction_ref, status)
             VALUES ($1,$2,$3,$4,'Online',$5,'success')`,
            [payment_id, order_id, business_id, amount, razorpay_payment_id]
        );
        await db.query(
            `UPDATE customer_order SET total_paid = total_paid + $1,
             balance_amount = balance_amount - $1,
             payment_status = CASE WHEN balance_amount - $1 <= 0 THEN 'paid' ELSE 'partial' END
             WHERE order_id = $2`,
            [amount, order_id]
        );
        await db.query('COMMIT');
        res.json({ success: true, payment_id });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[payment verify error]', err.message);
        res.status(500).json({ success: false, error: 'Payment recording failed' });
    }
});

module.exports = router;
