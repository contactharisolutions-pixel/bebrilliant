// routes/catalog.routes.js — Brands, Categories, Variants
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// ── BRANDS ──
router.get('/brands', auth, async (req, res) => {
    const { rows } = await db.query(`SELECT * FROM brands WHERE business_id=$1 ORDER BY name`, [req.query.business_id || req.user.business_id]);
    res.json({ success: true, data: rows });
});
router.post('/brands', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, brand_name, description } = req.body;
    const brand_id = `brand_${Date.now()}`;
    try {
        await db.query(`INSERT INTO brands (id, business_id, name, description) VALUES ($1,$2,$3,$4)`, [brand_id, business_id, brand_name, description]);
        res.status(201).json({ success: true, brand_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
router.put('/brands/:id', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { brand_name, description, active_status } = req.body;
    await db.query(`UPDATE brands SET name=$1, description=$2, active_status=$3 WHERE id=$4`, [brand_name, description, active_status, req.params.id]);
    res.json({ success: true });
});

// ── CATEGORIES ──
router.get('/categories', auth, async (req, res) => {
    const { rows } = await db.query(`SELECT * FROM categories WHERE business_id=$1 ORDER BY name`, [req.query.business_id || req.user.business_id]);
    res.json({ success: true, data: rows });
});
router.post('/categories', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, category_name, parent_category_id } = req.body;
    const category_id = `cat_${Date.now()}`;
    try {
        await db.query(`INSERT INTO categories (id, business_id, name, parent_category_id) VALUES ($1,$2,$3,$4)`, [category_id, business_id, category_name, parent_category_id || null]);
        res.status(201).json({ success: true, category_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── VARIANTS ──
router.get('/variants/:product_id', auth, async (req, res) => {
    const { rows } = await db.query(
        `SELECT v.*, COALESCE(i.available_qty,0) AS stock FROM variant v LEFT JOIN inventory i ON i.variant_id=v.variant_id WHERE v.product_id=$1`,
        [req.params.product_id]
    );
    res.json({ success: true, data: rows });
});
router.post('/variants', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { product_id, color, size, sku, barcode, image } = req.body;
    const variant_id = `var_${Date.now()}`;
    try {
        await db.query(`INSERT INTO variant (variant_id, product_id, color, size, sku, barcode, image) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [variant_id, product_id, color, size, sku || `SKU-${Date.now()}`, barcode, image]);
        res.status(201).json({ success: true, variant_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
router.delete('/variants/:id', auth, rbac('Admin'), async (req, res) => {
    await db.query(`DELETE FROM variant WHERE variant_id=$1`, [req.params.id]);
    res.json({ success: true });
});

module.exports = router;
