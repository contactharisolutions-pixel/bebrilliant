// routes/settings.routes.js — Central System Settings Backend
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// 1. GET — Fetch all settings for a business
router.get('/', auth, async (req, res) => {
    console.log('[API] Settings GET hit');
    try {
        const { business_id } = req.user;
        const { rows } = await db.query('SELECT setting_key, setting_value FROM business_settings WHERE business_id = $1', [business_id]);
        
        // Convert to a flat key-value object
        const settings = {};
        rows.forEach(r => settings[r.setting_key] = r.setting_value);
        
        res.json({ success: true, data: settings });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 2. POST — Update or Create a setting
router.post('/', auth, rbac('Admin'), async (req, res) => {
    try {
        const { business_id } = req.user;
        const { key, value } = req.body; // value should be a JSON object
        
        if (!key || value === undefined) return res.status(400).json({ success: false, error: 'Key and value required' });

        const query = `
            INSERT INTO business_settings (business_id, setting_key, setting_value)
            VALUES ($1, $2, $3)
            ON CONFLICT (business_id, setting_key)
            DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
            RETURNING *`;
            
        const { rows } = await db.query(query, [business_id, key, value]);
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 3. POST /bulk — Update multiple settings at once
router.post('/bulk', auth, rbac('Admin'), async (req, res) => {
    const client = await db.connect(); // Need precise control for transactions
    try {
        const { business_id } = req.user;
        const { settings } = req.body; // e.g. { "gst_settings": {...}, "payment_settings": {...} }
        
        if (!settings || typeof settings !== 'object') return res.status(400).json({ success: false, error: 'Invalid settings format' });

        await client.query('BEGIN');
        
        for (const [key, value] of Object.entries(settings)) {
            await client.query(`
                INSERT INTO business_settings (business_id, setting_key, setting_value)
                VALUES ($1, $2, $3)
                ON CONFLICT (business_id, setting_key)
                DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
                [business_id, key, value]
            );
        }
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
