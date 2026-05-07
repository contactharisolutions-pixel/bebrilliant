// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (id, role, business_id, showroom_id) =>
    jwt.sign({ id, role, business_id, showroom_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

// POST /api/auth/customer/signup
router.post('/customer/signup', async (req, res) => {
    const { business_id, name, mobile, email, password } = req.body;
    if (!name || !mobile || !email || !password)
        return res.status(400).json({ success: false, error: 'All fields required' });

    const passwordHash = await bcrypt.hash(password, 12);
    const customerId = `cust_${Date.now()}`;

    try {
        await db.query(
            `INSERT INTO customer (customer_id, business_id, name, mobile, email, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [customerId, business_id || 'default', name, mobile, email, passwordHash]
        );
        const token = generateToken(customerId, 'customer', business_id || 'default', null);
        res.cookie('token', token, cookieOpts);
        res.status(201).json({ success: true, user: { id: customerId, name, email } });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, error: 'Email or mobile already registered' });
        console.error('[signup error]', err.message);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

// POST /api/auth/customer/login
router.post('/customer/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, error: 'Email and password required' });

    try {
        const { rows } = await db.query('SELECT * FROM customer WHERE email = $1', [email]);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash)))
            return res.status(401).json({ success: false, error: 'Invalid credentials' });

        await db.query('UPDATE customer SET last_login = NOW() WHERE customer_id = $1', [user.customer_id]);
        const token = generateToken(user.customer_id, 'customer', user.business_id, null);
        res.cookie('token', token, cookieOpts);
        res.json({ success: true, user: { id: user.customer_id, name: user.name, email: user.email } });
    } catch (err) {
        console.error('[customer login error]', err.message);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// POST /api/auth/staff/login
router.post('/staff/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, error: 'Email and password required' });

    try {
        const { rows } = await db.query('SELECT * FROM app_user WHERE email = $1 AND active_status = true', [email]);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash)))
            return res.status(401).json({ success: false, error: 'Invalid staff credentials' });

        await db.query('UPDATE app_user SET last_login = NOW() WHERE user_id = $1', [user.user_id]);
        const token = generateToken(user.user_id, user.role, user.business_id, user.showroom_id);
        res.cookie('token', token, cookieOpts);
        const { ROLE_PERMISSIONS } = require('../middleware/rbac');
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        res.json({ success: true, user: { id: user.user_id, name: user.name, role: user.role, business_id: user.business_id, showroom_id: user.showroom_id, permissions } });
    } catch (err) {
        console.error('[staff login error]', err.message);
        res.status(500).json({ success: false, error: 'Staff login failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
    res.json({ success: true, user: req.user });
});

// GET /api/auth/permissions — returns allowed modules for current user's role
router.get('/permissions', require('../middleware/auth'), (req, res) => {
    const { ROLE_PERMISSIONS } = require('../middleware/rbac');
    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    res.json({ success: true, role: req.user.role, permissions });
});

module.exports = router;
