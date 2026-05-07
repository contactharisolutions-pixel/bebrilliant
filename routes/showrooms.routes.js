// routes/showrooms.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/showrooms
router.get('/', auth, async (req, res) => {
    const { business_id } = req.query;
    const finalBizId = business_id || req.user?.business_id;
    const sql = `SELECT s.*, 
                (SELECT COUNT(*) FROM app_user u WHERE u.showroom_id = s.showroom_id AND u.business_id = s.business_id) AS staff_count,
                (SELECT COALESCE(SUM(i.available_qty),0) FROM inventory i WHERE i.showroom_id = s.showroom_id AND i.business_id = s.business_id) AS total_stock
             FROM showroom s 
             WHERE s.business_id = $1 
             ORDER BY s.created_at DESC`;
    try {
        console.log(`🔍 [Showrooms Query]: ${finalBizId}`);
        const { rows } = await db.query(sql, [finalBizId]);
        res.json({ success: true, data: rows });
    } catch (err) { 
        console.error('[Showrooms SQL Error]:', err.message);
        console.error('SQL State:', sql);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// POST /api/showrooms
router.post('/', auth, rbac('Admin'), async (req, res) => {
    const { business_id, showroom_name, address, city, contact_number, manager_name, gstin, email, secondary_contact, google_maps_link } = req.body;
    if (!showroom_name) return res.status(400).json({ success: false, error: 'showroom_name required' });
    const showroom_id = `show_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO showroom (showroom_id, business_id, showroom_name, address, city, contact_number, manager_name, gstin, email, secondary_contact, google_maps_link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [showroom_id, business_id, showroom_name, address, city, contact_number, manager_name, gstin, email, secondary_contact, google_maps_link]
        );
        res.status(201).json({ success: true, showroom_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/showrooms/:id
router.put('/:id', auth, rbac('Admin'), async (req, res) => {
    const { showroom_name, address, city, contact_number, manager_name, active_status, gstin, email, secondary_contact, google_maps_link } = req.body;
    try {
        await db.query(
            `UPDATE showroom SET 
                showroom_name = COALESCE($1, showroom_name), 
                address = COALESCE($2, address), 
                city = COALESCE($3, city), 
                contact_number = COALESCE($4, contact_number), 
                manager_name = COALESCE($5, manager_name), 
                active_status = COALESCE($6, active_status),
                gstin = COALESCE($7, gstin),
                email = COALESCE($8, email),
                secondary_contact = COALESCE($9, secondary_contact),
                google_maps_link = COALESCE($10, google_maps_link)
            WHERE showroom_id = $11`,
            [
                showroom_name ?? null, 
                address ?? null, 
                city ?? null, 
                contact_number ?? null, 
                manager_name ?? null, 
                active_status ?? null, 
                gstin ?? null, 
                email ?? null, 
                secondary_contact ?? null, 
                google_maps_link ?? null, 
                req.params.id
            ]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
