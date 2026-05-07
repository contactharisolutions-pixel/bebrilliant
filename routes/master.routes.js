// routes/master.routes.js — Dynamic Master Data CRUD
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors', 'lens_materials'];

// Utility to validate table name
const validateTable = (table) => {
    if (!TABLES.includes(table)) throw new Error('Invalid master data source');
};

// GET /api/master/:table — List all records
router.get('/:table', auth, async (req, res) => {
    try {
        const { table } = req.params;
        validateTable(table);
        const business_id = req.user.business_id || 'biz_blink_001';
        console.log(`[Master GET] User Role: ${req.user.role}, User ID: ${req.user.id}, Req Biz: ${req.user.business_id}`);
        
        const { rows } = await db.query(
            `SELECT * FROM ${table} WHERE business_id = $1 ORDER BY name ASC`,
            [business_id]
        );
        console.log(`[Master GET] Table: ${table}, Biz: ${business_id}, Rows: ${rows.length}`);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/master/:table — Create record
router.post('/:table', auth, rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const { table } = req.params;
        validateTable(table);
        const business_id = req.user.business_id || 'biz_blink_001';
        const body = req.body;
        
        // Auto-generate slug from name if not provided
        const slug = body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        
        // Extract dynamically based on table needs
        const cols = ['business_id', 'name', 'slug', 'active_status'];
        const vals = [business_id, body.name, slug, body.active_status !== undefined ? body.active_status : true];
        
        if (table === 'brands') {
            cols.push('logo', 'hero_url', 'description');
            vals.push(body.logo || null, body.hero_url || null, body.description || null);
        }
        if (table === 'categories') {
            cols.push('parent_category_id');
            vals.push(body.parent_category_id || null);
        }
        if (table === 'frame_colors') {
            cols.push('color_code');
            vals.push(body.color_code || null);
        }
        
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        
        const { rows } = await db.query(query, vals);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/master/:table/:id — Update record
router.put('/:table/:id', auth, rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const { table, id } = req.params;
        validateTable(table);
        const business_id = req.user.business_id || 'biz_blink_001';
        const body = req.body;
        
        const setClauses = ['name = $1', 'slug = $2', 'active_status = $3', 'updated_at = NOW()'];
        const vals = [body.name, body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'), body.active_status, business_id, id];
        
        let counter = 6;
        if (table === 'brands') {
            setClauses.push(`logo = $${counter++}`, `hero_url = $${counter++}`, `description = $${counter++}`);
            vals.push(body.logo || null, body.hero_url || null, body.description || null);
        }
        if (table === 'categories') {
            setClauses.push(`parent_category_id = $${counter++}`);
            vals.push(body.parent_category_id || null);
        }
        if (table === 'frame_colors') {
            setClauses.push(`color_code = $${counter++}`);
            vals.push(body.color_code || null);
        }
        
        const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE business_id = $4 AND id = $5 RETURNING *`;
        const { rows } = await db.query(query, vals);
        
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/master/:table/:id/toggle — Toggle Active Status
router.patch('/:table/:id/toggle', auth, rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const { table, id } = req.params;
        validateTable(table);
        const business_id = req.user.business_id || 'biz_blink_001';
        
        await db.query(
            `UPDATE ${table} SET active_status = NOT active_status, updated_at = NOW() WHERE business_id = $1 AND id = $2`,
            [business_id, id]
        );
        res.json({ success: true, message: 'Status toggled successfully' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/master/:table/:id — Hard Delete
router.delete('/:table/:id', auth, rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const { table, id } = req.params;
        validateTable(table);
        const business_id = req.user.business_id || 'biz_blink_001';
        
        await db.query(
            `DELETE FROM ${table} WHERE business_id = $1 AND id = $2`,
            [business_id, id]
        );
        res.json({ success: true, message: 'Record deleted permanently' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
