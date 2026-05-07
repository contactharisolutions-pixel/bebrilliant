const express = require('express');
const router = express.Router();
const db = require('../db');
const guards = require('../middleware/roleGuards');

// ─── PAGE MANAGEMENT ──────────────────────────────────────────────────────────

// GET /api/cms/pages
router.get('/pages', guards.marketing, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM pages ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/cms/pages
router.get('/pages/:id', guards.marketing, async (req, res) => {
    try {
        const page = await db.query('SELECT * FROM pages WHERE id = $1', [req.params.id]);
        if (page.rows.length === 0) return res.status(404).json({ success: false, error: 'Page not found' });
        
        const seo = await db.query('SELECT * FROM page_seo WHERE page_id = $1', [req.params.id]);
        const sections = await db.query('SELECT * FROM page_sections WHERE page_id = $1 ORDER BY section_order ASC', [req.params.id]);
        
        res.json({ 
            success: true, 
            data: { 
                ...page.rows[0], 
                seo: seo.rows[0] || {}, 
                sections: sections.rows 
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/cms/pages
router.post('/pages', guards.marketing, async (req, res) => {
    const { page_name, slug, page_type, status } = req.body;
    const id = 'pg_' + Date.now().toString(36);
    try {
        await db.query(`
            INSERT INTO pages (id, page_name, slug, page_type, status)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, page_name, slug, page_type || 'custom', status || 'draft']);
        
        // Init SEO
        await db.query('INSERT INTO page_seo (page_id) VALUES ($1)', [id]);
        
        res.json({ success: true, data: { id } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/cms/pages/:id
router.put('/pages/:id', guards.marketing, async (req, res) => {
    const { page_name, slug, page_type, status, seo } = req.body;
    try {
        await db.query(`
            UPDATE pages SET page_name = $1, slug = $2, page_type = $3, status = $4, updated_at = NOW()
            WHERE id = $5
        `, [page_name, slug, page_type, status, req.params.id]);
        
        if (seo) {
            await db.query(`
                INSERT INTO page_seo (page_id, seo_title, seo_description, seo_keywords)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (page_id) DO UPDATE SET
                seo_title = EXCLUDED.seo_title,
                seo_description = EXCLUDED.seo_description,
                seo_keywords = EXCLUDED.seo_keywords,
                updated_at = NOW()
            `, [req.params.id, seo.seo_title, seo.seo_description, seo.seo_keywords]);
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/cms/pages/:id
router.delete('/pages/:id', guards.marketing, async (req, res) => {
    try {
        await db.query('DELETE FROM pages WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── SECTION MANAGEMENT ───────────────────────────────────────────────────────

// POST /api/cms/pages/:id/sections
router.post('/pages/:id/sections', guards.marketing, async (req, res) => {
    const { section_type, section_order, content_json } = req.body;
    const id = 'sec_' + Date.now().toString(36);
    try {
        await db.query(`
            INSERT INTO page_sections (id, page_id, section_type, section_order, content_json)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, req.params.id, section_type, section_order || 0, JSON.stringify(content_json || {})]);
        res.json({ success: true, data: { id } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/cms/sections/:id
router.put('/sections/:id', guards.marketing, async (req, res) => {
    const { section_type, section_order, content_json, status } = req.body;
    try {
        await db.query(`
            UPDATE page_sections SET 
            section_type = COALESCE($1, section_type),
            section_order = COALESCE($2, section_order),
            content_json = COALESCE($3, content_json),
            status = COALESCE($4, status),
            updated_at = NOW()
            WHERE id = $5
        `, [section_type, section_order, content_json ? JSON.stringify(content_json) : null, status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/cms/sections/:id
router.delete('/sections/:id', guards.marketing, async (req, res) => {
    try {
        await db.query('DELETE FROM page_sections WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
