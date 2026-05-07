// routes/marketing.routes.js — Offers, Coupons, Campaigns
const express = require('express');
const router = express.Router();
const db = require('../db');
const rbac = require('../middleware/rbac');
// Note: auth + rbac('Admin','Marketing') is applied globally via guards.marketing in server.js
// Write routes below use rbac('Admin','Manager') for fine-grained role control.

// ── OFFERS ──
// GET /api/marketing/offers/kpis — Aggregate marketing metrics
// GET /api/marketing/offers-stats — Aggregate marketing metrics
router.get('/offers-stats', async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const [total, active, expired] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM offer WHERE business_id = $1`, [business_id]),
            db.query(`SELECT COUNT(*) FROM offer WHERE business_id = $1 AND active_status = true AND end_date >= CURRENT_DATE`, [business_id]),
            db.query(`SELECT COUNT(*) FROM offer WHERE business_id = $1 AND end_date < CURRENT_DATE`, [business_id])
        ]);

        res.json({
            success: true,
            data: {
                totalOffers: parseInt(total.rows[0].count),
                activeOffers: parseInt(active.rows[0].count),
                expiredOffers: parseInt(expired.rows[0].count)
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/offers', async (req, res) => {
    const { business_id, search, status, type } = req.query;
    const bizId = business_id || req.user.business_id;
    
    let query = `SELECT * FROM offer WHERE business_id = $1`;
    const values = [bizId];
    let i = 2;

    if (status === 'active') { query += ` AND active_status = true AND end_date >= CURRENT_DATE`; }
    else if (status === 'expired') { query += ` AND end_date < CURRENT_DATE`; }
    else if (status === 'inactive') { query += ` AND active_status = false`; }

    if (type) { query += ` AND offer_type = $${i++}`; values.push(type); }
    if (search) { query += ` AND offer_name ILIKE $${i++}`; values.push(`%${search}%`); }

    query += ` ORDER BY created_at DESC`;

    try {
        const { rows } = await db.query(query, values);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/offers', rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, offer_name, offer_type, discount_value, apply_on, apply_target, channel_scope, showroom_targets, start_date, end_date } = req.body;
    const bizId = business_id || req.user.business_id;
    const offer_id = `off_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO offer (offer_id, business_id, offer_name, offer_type, discount_value, apply_on, apply_target, channel_scope, showroom_targets, start_date, end_date, active_status) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
            [offer_id, bizId, offer_name, offer_type, discount_value, apply_on, apply_target, channel_scope, JSON.stringify(showroom_targets || []), start_date, end_date]
        );
        res.status(201).json({ success: true, offer_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/offers/:id/toggle', rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const id = req.params.id.replace(/\./g, '_');
        await db.query(`UPDATE offer SET active_status = NOT active_status WHERE offer_id = $1 OR offer_id = $2`, [req.params.id, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/offers/:id', async (req, res) => {
    try {
        const id = req.params.id.replace(/\./g, '_');
        const { rows } = await db.query(`SELECT * FROM offer WHERE offer_id = $1 OR offer_id = $2`, [req.params.id, id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Offer not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/offers/:id', rbac('Admin', 'Manager'), async (req, res) => {
    const { offer_name, offer_type, discount_value, apply_on, apply_target, channel_scope, showroom_targets, start_date, end_date } = req.body;
    try {
        const id = req.params.id.replace(/\./g, '_');
        await db.query(
            `UPDATE offer SET offer_name=$1, offer_type=$2, discount_value=$3, apply_on=$4, apply_target=$5, channel_scope=$6, showroom_targets=$7, start_date=$8, end_date=$9 
             WHERE offer_id=$10 OR offer_id=$11`,
            [offer_name, offer_type, discount_value, apply_on, apply_target, channel_scope, JSON.stringify(showroom_targets || []), start_date, end_date, req.params.id, id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/offers/:id', rbac('Admin', 'Manager'), async (req, res) => {
    const { offer_name, offer_type, discount_value, end_date } = req.body;
    try {
        await db.query(
            `UPDATE offer SET offer_name = $1, offer_type = $2, discount_value = $3, end_date = $4 WHERE offer_id = $5`,
            [offer_name, offer_type, discount_value, end_date, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/offers/:id', rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const id = req.params.id.replace(/\./g, '_');
        await db.query(`DELETE FROM offer WHERE offer_id = $1 OR offer_id = $2`, [req.params.id, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});



// ── COUPONS ──
router.get('/coupons-stats', async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const [total, active, expired] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM coupon WHERE business_id = $1`, [business_id]),
            db.query(`SELECT COUNT(*) FROM coupon WHERE business_id = $1 AND active_status = true AND expiry_date >= CURRENT_DATE`, [business_id]),
            db.query(`SELECT COUNT(*) FROM coupon WHERE business_id = $1 AND expiry_date < CURRENT_DATE`, [business_id])
        ]);
        res.json({
            success: true,
            data: {
                totalCoupons: parseInt(total.rows[0].count),
                activeCoupons: parseInt(active.rows[0].count),
                expiredCoupons: parseInt(expired.rows[0].count)
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/coupons', async (req, res) => {
    const { search, status } = req.query;
    const business_id = req.user.business_id;
    let query = `SELECT * FROM coupon WHERE business_id = $1`;
    const values = [business_id];
    let i = 2;

    if (status === 'active') { query += ` AND active_status = true AND expiry_date >= CURRENT_DATE`; }
    else if (status === 'expired') { query += ` AND expiry_date < CURRENT_DATE`; }
    else if (status === 'inactive') { query += ` AND active_status = false`; }

    if (search) { query += ` AND code ILIKE $${i}`; values.push(`%${search}%`); i++; }

    query += ` ORDER BY created_at DESC`;
    try {
        const { rows } = await db.query(query, values);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
router.post('/coupons', rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, code, coupon_type, discount_type, discount_value, min_order_value, usage_limit, expiry_date } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code required' });
    const bizId = business_id || req.user.business_id;
    const exp = (expiry_date === '' || !expiry_date) ? null : expiry_date;
    try {
        await db.query(
            `INSERT INTO coupon (business_id, code, coupon_type, discount_type, discount_value, min_order_value, usage_limit, used_count, expiry_date, active_status) VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,true)`,
            [bizId, code.toUpperCase(), coupon_type || 'Festival coupon', discount_type, discount_value, min_order_value, usage_limit, exp]
        );
        res.status(201).json({ success: true, code: code.toUpperCase() });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/coupons/:id/toggle', rbac('Admin', 'Manager'), async (req, res) => {
    try {
        await db.query(`UPDATE coupon SET active_status = NOT active_status WHERE code = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/coupons/:id', async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM coupon WHERE code = $1`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Coupon not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/coupons/:id', rbac('Admin', 'Manager'), async (req, res) => {
    const { coupon_type, discount_type, discount_value, min_order_value, usage_limit, expiry_date, active_status } = req.body;
    try {
        await db.query(
            `UPDATE coupon SET coupon_type=$1, discount_type=$2, discount_value=$3, min_order_value=$4, usage_limit=$5, expiry_date=$6, active_status=$7 WHERE code=$8`,
            [coupon_type, discount_type, discount_value, min_order_value, usage_limit, expiry_date, active_status, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/coupons/:id', rbac('Admin', 'Manager'), async (req, res) => {
    try {
        await db.query(`DELETE FROM coupon WHERE code = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Validate coupon (checkout) — accessible to all authenticated users
router.post('/coupons/validate', async (req, res) => {
    const { code, order_amount, business_id } = req.body;
    try {
        const { rows } = await db.query(
            `SELECT * FROM coupon WHERE code=$1 AND business_id=$2 AND active_status=true AND expiry_date >= CURRENT_DATE`,
            [code.toUpperCase(), business_id]
        );
        const coupon = rows[0];
        if (!coupon) return res.status(404).json({ success: false, error: 'Invalid or expired coupon' });
        if (coupon.min_order_value && order_amount < coupon.min_order_value)
            return res.status(400).json({ success: false, error: `Minimum order ₹${coupon.min_order_value} required` });
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
            return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
        const discount = coupon.discount_type === 'Percentage'
            ? (order_amount * coupon.discount_value / 100) : coupon.discount_value;
        res.json({ success: true, discount: Math.min(discount, order_amount), coupon });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── CAMPAIGNS ──
router.get('/campaigns-stats', async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const [total, running, drafted] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM campaign WHERE business_id = $1`, [business_id]),
            db.query(`SELECT COUNT(*) FROM campaign WHERE business_id = $1 AND status = 'Running'`, [business_id]),
            db.query(`SELECT COUNT(*) FROM campaign WHERE business_id = $1 AND status = 'Draft'`, [business_id])
        ]);
        res.json({
            success: true,
            data: {
                totalCampaigns: parseInt(total.rows[0].count),
                runningCampaigns: parseInt(running.rows[0].count),
                draftedCampaigns: parseInt(drafted.rows[0].count)
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/campaigns', async (req, res) => {
    const { search, status, type } = req.query;
    const business_id = req.user.business_id;
    let query = `SELECT * FROM campaign WHERE business_id = $1`;
    const values = [business_id];
    let i = 2;

    if (status) { query += ` AND status = $${i++}`; values.push(status); }
    if (type) { query += ` AND campaign_type = $${i++}`; values.push(type); }
    if (search) { query += ` AND campaign_name ILIKE $${i++}`; values.push(`%${search}%`); }

    query += ` ORDER BY created_at DESC`;
    try {
        const { rows } = await db.query(query, values);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
router.post('/campaigns', rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, campaign_name, campaign_type, target_segment, message } = req.body;
    const bizId = business_id || req.user.business_id;
    const campaign_id = `camp_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO campaign (campaign_id, business_id, campaign_name, campaign_type, target_segment, message, status) VALUES ($1,$2,$3,$4,$5,$6,'Draft')`,
            [campaign_id, bizId, campaign_name, campaign_type, target_segment, message]
        );
        res.status(201).json({ success: true, campaign_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/campaigns/:id/status', rbac('Admin', 'Manager'), async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(`UPDATE campaign SET status = $1 WHERE campaign_id = $2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/campaigns/:id', async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM campaign WHERE campaign_id = $1`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Campaign not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/campaigns/:id', rbac('Admin', 'Manager'), async (req, res) => {
    const { campaign_name, campaign_type, target_segment, message } = req.body;
    try {
        await db.query(
            `UPDATE campaign SET campaign_name=$1, campaign_type=$2, target_segment=$3, message=$4 WHERE campaign_id=$5`,
            [campaign_name, campaign_type, target_segment, message, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/campaigns/:id', rbac('Admin', 'Manager'), async (req, res) => {
    try {
        await db.query(`DELETE FROM campaign WHERE campaign_id = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


// ── COMMUNICATION ──
router.get('/comm-stats', async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const [templates, logs_today, failed] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM message_template WHERE business_id = $1`, [business_id]),
            db.query(`SELECT COUNT(*) FROM communication_log WHERE business_id = $1 AND sent_at >= CURRENT_DATE`, [business_id]),
            db.query(`SELECT COUNT(*) FROM communication_log WHERE business_id = $1 AND status = 'Failed'`, [business_id])
        ]);
        res.json({
            success: true,
            data: {
                totalTemplates: parseInt(templates.rows[0].count),
                sentToday: parseInt(logs_today.rows[0].count),
                failedCommunications: parseInt(failed.rows[0].count)
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/templates', async (req, res) => {
    const { rows } = await db.query(`SELECT * FROM message_template WHERE business_id=$1 ORDER BY created_at DESC`, [req.user.business_id]);
    res.json({ success: true, data: rows });
});

router.post('/templates', rbac('Admin', 'Manager'), async (req, res) => {
    const { template_name, channel, message_content, variables } = req.body;
    const template_id = `tmpl_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO message_template (template_id, business_id, template_name, channel, message_content, variables) VALUES ($1,$2,$3,$4,$5,$6)`,
            [template_id, req.user.business_id, template_name, (channel || 'WhatsApp').toLowerCase(), message_content, JSON.stringify(variables || [])]
        );
        res.status(201).json({ success: true, template_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/logs', async (req, res) => {
    const { channel, status } = req.query;
    const business_id = req.user.business_id;
    let query = `SELECT l.*, c.name as customer_name FROM communication_log l 
                 LEFT JOIN customer c ON l.customer_id = c.customer_id 
                 WHERE l.business_id = $1`;
    const values = [business_id];
    let i = 2;

    if (channel) { query += ` AND l.channel = $${i++}`; values.push(channel); }
    if (status) { query += ` AND l.status = $${i++}`; values.push(status); }
    
    query += ` ORDER BY l.sent_at DESC LIMIT 100`;
    try {
        const { rows } = await db.query(query, values);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
