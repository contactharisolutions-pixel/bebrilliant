// routes/tax.routes.js — Advanced Tax Rules & GST Logic
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// 1. GET — List all tax rules
router.get('/rules', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { rows } = await db.query(`
            SELECT t.*, 
                   c.name as category_name, 
                   c.id as mapped_category_id,
                   p.product_name 
            FROM tax_rules t
            LEFT JOIN category_tax_mapping ctm ON t.id = ctm.tax_rule_id
            LEFT JOIN categories c ON ctm.category_id = c.id
            LEFT JOIN product_tax_mapping ptm ON t.id = ptm.tax_rule_id
            LEFT JOIN product p ON ptm.product_id = p.product_id
            WHERE t.business_id = $1 
            ORDER BY t.created_at DESC
        `, [business_id]);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 2. POST — Create Tax Rule
router.post('/rules', auth, rbac('Admin'), async (req, res) => {
    const { tax_name, tax_percentage, applicable_on } = req.body;
    try {
        const { rows } = await db.query(
            `INSERT INTO tax_rules (business_id, tax_name, tax_percentage, applicable_on)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.business_id, tax_name, tax_percentage, applicable_on || 'product']
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 3. POST — Map Tax to Category (many-to-many: same category can have multiple rules, but one rule belongs to one category)
router.post('/map/category', auth, rbac('Admin'), async (req, res) => {
    const { category_id, tax_rule_id } = req.body;
    try {
        await db.query(`DELETE FROM category_tax_mapping WHERE tax_rule_id = $1 AND business_id = $2`, [tax_rule_id, req.user.business_id]);
        await db.query(
            `INSERT INTO category_tax_mapping (category_id, business_id, tax_rule_id)
             VALUES ($1, $2, $3) ON CONFLICT (category_id, business_id, tax_rule_id) DO NOTHING`,
            [category_id, req.user.business_id, tax_rule_id]
        );
        res.json({ success: true, message: 'Category tax mapping updated' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 4. POST — Map Tax to Product
router.post('/map/product', auth, rbac('Admin'), async (req, res) => {
    const { product_id, tax_rule_id } = req.body;
    try {
        await db.query(`DELETE FROM product_tax_mapping WHERE tax_rule_id = $1`, [tax_rule_id]);
        await db.query(
            `INSERT INTO product_tax_mapping (product_id, tax_rule_id)
             VALUES ($1, $2) ON CONFLICT (product_id, tax_rule_id) DO NOTHING`,
            [product_id, tax_rule_id]
        );
        res.json({ success: true, message: 'Product tax mapping updated' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 5. POST — CALCULATE TAX ENGINE
// Input: { items: [{ product_id, price, qty }], customer_id, showroom_id }
router.post('/calculate', auth, async (req, res) => {
    try {
        const { items, customer_id, showroom_id } = req.body;
        const { business_id } = req.user;

        if (!items || !items.length) return res.json({ success: true, breakdown: [], total_tax: 0 });

        // 1. Determine inter-state for CGST/SGST vs IGST split
        const [showroomRes, customerRes] = await Promise.all([
            showroom_id ? db.query('SELECT state FROM showroom WHERE showroom_id = $1', [showroom_id]) : { rows: [] },
            customer_id ? db.query('SELECT state FROM customer WHERE customer_id = $1', [customer_id]) : { rows: [] }
        ]);

        const showroomState = showroomRes.rows[0]?.state || 'Gujarat';
        const customerState = customerRes.rows[0]?.state || showroomState;
        const isInterState = showroomState.toLowerCase() !== customerState.toLowerCase();

        // 2. Priority-based GST lookup per product:
        //    Level 1 — Product-level mapping  (highest priority)
        //    Level 2 — Category-level mapping
        //    Level 3 — Business default active rule
        //    Level 4 — Hardcoded eyewear fallback (18% for sunglasses/frames)
        const taxLookupQuery = `
            WITH ranked_rules AS (
                SELECT tax_percentage, 1 AS priority
                FROM tax_rules tr
                INNER JOIN product_tax_mapping ptm ON tr.id = ptm.tax_rule_id
                WHERE ptm.product_id = $1 AND tr.business_id = $2 AND tr.active_status = TRUE

                UNION ALL

                SELECT tr.tax_percentage, 2 AS priority
                FROM tax_rules tr
                INNER JOIN category_tax_mapping ctm ON tr.id = ctm.tax_rule_id
                WHERE ctm.category_id = (SELECT category_id FROM product WHERE product_id = $1)
                  AND ctm.business_id = $2 AND tr.active_status = TRUE

                UNION ALL

                SELECT tax_percentage, 3 AS priority
                FROM tax_rules
                WHERE business_id = $2 AND active_status = TRUE AND applicable_on = 'product'
            )
            SELECT SUM(tax_percentage) as tax_percentage
            FROM ranked_rules
            WHERE priority = (SELECT MIN(priority) FROM ranked_rules)
        `;

        const results = [];
        let totalTax = 0;

        for (const item of items) {
            const taxRes = await db.query(taxLookupQuery, [item.product_id, business_id]);
            // Fallback: 18% for sunglasses/frames (HSN 9004/9003), 12% for lenses (HSN 9001)
            const taxPercent = parseFloat(taxRes.rows[0]?.tax_percentage ?? 18);

            const inclusivePrice = parseFloat(item.price) * parseInt(item.qty);
            // Inclusive GST calculation: TaxableValue = Total / (1 + Rate/100)
            const taxableValue = inclusivePrice / (1 + taxPercent / 100);
            const itemTaxTotal = parseFloat((inclusivePrice - taxableValue).toFixed(2));

            let cgst = 0, sgst = 0, igst = 0;
            if (isInterState) {
                igst = itemTaxTotal;
            } else {
                cgst = parseFloat((itemTaxTotal / 2).toFixed(2));
                sgst = parseFloat((itemTaxTotal / 2).toFixed(2));
            }

            results.push({
                product_id: item.product_id,
                tax_percent: taxPercent,
                taxable_value: parseFloat(taxableValue.toFixed(2)),
                cgst, sgst, igst,
                item_tax_total: itemTaxTotal
            });
            totalTax += itemTaxTotal;
        }

        res.json({
            success: true,
            is_inter_state: isInterState,
            breakdown: results,
            total_tax: parseFloat(totalTax.toFixed(2))
        });

    } catch (err) {
        console.error('[tax/calculate error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. POST — Seed default eyewear GST rules (Admin only)
// Correct Indian GST: Sunglasses/Frames 18% (HSN 9004/9003), Lenses 12% (HSN 9001)
router.post('/seed-defaults', auth, rbac('Admin'), async (req, res) => {
    const { business_id } = req.user;
    try {
        await db.query('BEGIN');

        // Deactivate any wrong low-rate rules
        await db.query(
            `UPDATE tax_rules SET active_status = FALSE WHERE business_id = $1 AND tax_percentage < 5`,
            [business_id]
        );

        // Upsert 18% rule — Sunglasses, Eyewear (HSN 9004)
        const rule18 = await db.query(
            `INSERT INTO tax_rules (business_id, tax_name, tax_percentage, applicable_on, active_status)
             VALUES ($1, 'GST 18% — Sunglasses/Eyewear (HSN 9004)', 18.00, 'category', TRUE)
             ON CONFLICT DO NOTHING RETURNING id`,
            [business_id]
        );
        let rule18Id = rule18.rows[0]?.id;
        if (!rule18Id) {
            const existing = await db.query(
                `SELECT id FROM tax_rules WHERE business_id=$1 AND tax_percentage=18 AND active_status=TRUE LIMIT 1`,
                [business_id]
            );
            rule18Id = existing.rows[0]?.id;
        }

        // Upsert 12% rule — Lenses, Frames (HSN 9001/9003)
        const rule12 = await db.query(
            `INSERT INTO tax_rules (business_id, tax_name, tax_percentage, applicable_on, active_status)
             VALUES ($1, 'GST 12% — Lenses/Frames (HSN 9001/9003)', 12.00, 'category', TRUE)
             ON CONFLICT DO NOTHING RETURNING id`,
            [business_id]
        );
        let rule12Id = rule12.rows[0]?.id;
        if (!rule12Id) {
            const existing = await db.query(
                `SELECT id FROM tax_rules WHERE business_id=$1 AND tax_percentage=12 AND active_status=TRUE LIMIT 1`,
                [business_id]
            );
            rule12Id = existing.rows[0]?.id;
        }

        // Auto-map categories
        const cats = await db.query(
            `SELECT category_id, name FROM category WHERE business_id = $1`,
            [business_id]
        );

        let mapped = 0;
        for (const cat of cats.rows) {
            const isLens = /lens|contact|frame/i.test(cat.name);
            const ruleId = isLens ? rule12Id : rule18Id;
            if (!ruleId) continue;
            await db.query(
                `INSERT INTO category_tax_mapping (category_id, business_id, tax_rule_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (category_id, business_id) DO UPDATE SET tax_rule_id = EXCLUDED.tax_rule_id`,
                [cat.category_id, business_id, ruleId]
            );
            mapped++;
        }

        await db.query('COMMIT');
        res.json({
            success: true,
            message: `GST rules seeded: 18% (sunglasses/eyewear), 12% (lenses/frames). ${mapped} categories mapped.`,
            rule_18_id: rule18Id,
            rule_12_id: rule12Id
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[tax/seed-defaults error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7. PUT — Update tax rule
router.put('/rules/:id', auth, rbac('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { tax_name, tax_percentage, applicable_on } = req.body;
        const { rows } = await db.query(
            `UPDATE tax_rules 
             SET tax_name = COALESCE($1, tax_name),
                 tax_percentage = COALESCE($2, tax_percentage),
                 applicable_on = COALESCE($3, applicable_on)
             WHERE id = $4 AND business_id = $5
             RETURNING *`,
            [tax_name || null, tax_percentage || null, applicable_on || null, id, req.user.business_id]
        );
        if(!rows.length) return res.status(404).json({ success: false, error: 'Tax rule not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 8. PUT — Toggle active status
router.put('/rules/:id/status', auth, rbac('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await db.query(
            `UPDATE tax_rules SET active_status = NOT active_status WHERE id = $1 AND business_id = $2 RETURNING active_status`,
            [id, req.user.business_id]
        );
        if(!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, active_status: rows[0].active_status });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 8. DELETE — Delete tax rule
router.delete('/rules/:id', auth, rbac('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM tax_rules WHERE id = $1 AND business_id = $2`, [id, req.user.business_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
