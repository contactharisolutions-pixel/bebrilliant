// routes/business.routes.js — Multi-business management (Super Admin / Admin)
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/business — List all businesses (Admin only)
router.get('/', auth, rbac('Admin'), async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM business ORDER BY created_at DESC`);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/business/me — Get current business details
router.get('/me', auth, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM business WHERE business_id = $1`, [req.user.business_id]);
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/business — Create new business
router.post('/', auth, rbac('Admin'), async (req, res) => {
    const { business_name, owner_name, mobile_number, email, city, state, active_status, logo_url, pan_no, gstin_main, subscription_tier } = req.body;
    const business_id = `biz_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO business (business_id, business_name, owner_name, mobile_number, email, city, state, active_status, logo_url, pan_no, gstin_main, subscription_tier) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [business_id, business_name, owner_name, mobile_number, email, city, state, active_status !== undefined ? active_status : true, logo_url, pan_no, gstin_main, subscription_tier || 'Basic']
        );
        res.status(201).json({ success: true, business_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/business/:id — Update business details
router.put('/:id', auth, rbac('Admin'), async (req, res) => {
    const { business_name, owner_name, mobile_number, email, city, state, active_status, logo_url, pan_no, gstin_main, subscription_tier } = req.body;
    try {
        await db.query(
            `UPDATE business SET 
                business_name=$1, owner_name=$2, mobile_number=$3, email=$4, city=$5, state=$6, 
                active_status=$7, logo_url=$8, pan_no=$9, gstin_main=$10, subscription_tier=$11, 
                updated_at=NOW() 
             WHERE business_id=$12`,
            [business_name, owner_name, mobile_number, email, city, state, active_status, logo_url, pan_no, gstin_main, subscription_tier, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
