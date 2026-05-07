// routes/products.routes.js — Standard Product Entry & Full Catalog
// Fixed: PUT correctly writes to product + variant + inventory tables
// Fixed: GET returns joined color_code, size_code, total_stock, is_published
'use strict';
const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const auth     = require('../middleware/auth');
const multer   = require('multer');
const upload   = multer({ storage: multer.memoryStorage() });

// ─── COLUMN SETS ─────────────────────────────────────────────────────────────
const PRODUCT_COLS = new Set([
    'product_name','model_no','brand_id','category_id','gender_id','frame_type_id',
    'shape_id','material_id', 'lens_composite', 'lens_colorway', 'mrp','selling_price',
    'base_price','main_image','description','short_description','tags','seo_title',
    'seo_keywords','seo_description','video_url','additional_images','upc_code',
    'lens_width', 'bridge_size', 'temple_length', 'active_status','is_published',
    'vto_enabled','vto_overlay_url','vto_config','hsn_code','gst_rate'
]);

const VARIANT_COLS = new Set(['color_code','size_code','color','size','sku','barcode','variant_image','variant_price']);

// ─── ROUTES THAT MUST COME BEFORE /:id ───────────────────────────────────────

// GET /api/products/search — Fast Supabase stock search for POS Order picker
// Query: ?business_id=&q=&showroom_id=&type=frame|lens&limit=15
router.get('/search', async (req, res) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { business_id, q = '', showroom_id, type, limit = 15 } = req.query;
    const biz = business_id || (req.user && req.user.business_id) || '';
    if (!biz) return res.status(400).json({ success: false, error: 'business_id required' });
    try {
        // 1. Build product query with optional text search
        let query = supabase
            .from('product')
            .select('product_id,product_name,model_no,mrp,selling_price,brand_id,category_id,main_image')
            .eq('business_id', biz)
            .eq('active_status', true)
            .limit(parseInt(limit));

        if (q.trim()) {
            query = query.or(`product_name.ilike.%${q}%,model_no.ilike.%${q}%`);
        }

        const { data: products, error: pErr } = await query;
        if (pErr) throw new Error(pErr.message);
        if (!products || products.length === 0) return res.json({ success: true, data: [] });

        // 2. Fetch brands for names
        const brandIds = [...new Set(products.map(p => p.brand_id).filter(Boolean))];
        const { data: brands } = brandIds.length
            ? await supabase.from('brands').select('id,name').in('id', brandIds)
            : { data: [] };
        const brandMap = Object.fromEntries((brands || []).map(b => [b.id, b.name]));

        // 3. Fetch variants for all products
        const prodIds = products.map(p => p.product_id);
        const { data: variants } = await supabase.from('variant').select('variant_id,product_id,color_code,size_code,sku').in('product_id', prodIds);

        // 4. Fetch inventory (per showroom if specified)
        let invQuery = supabase.from('inventory').select('variant_id,available_qty,showroom_id').in('variant_id', (variants||[]).map(v => v.variant_id));
        if (showroom_id) invQuery = invQuery.eq('showroom_id', showroom_id);
        const { data: inventory } = await invQuery;

        // 5. Build variant+stock map
        const invMap = {};
        (inventory || []).forEach(i => {
            if (!invMap[i.variant_id]) invMap[i.variant_id] = 0;
            invMap[i.variant_id] += parseInt(i.available_qty || 0);
        });
        const varsByProduct = {};
        (variants || []).forEach(v => {
            if (!varsByProduct[v.product_id]) varsByProduct[v.product_id] = [];
            varsByProduct[v.product_id].push({ ...v, stock: invMap[v.variant_id] || 0 });
        });

        // 6. Enrich and return
        const data = products
            .filter(p => (varsByProduct[p.product_id] || []).length > 0)
            .map(p => ({
                product_id:    p.product_id,
                product_name:  p.product_name,
                model_no:      p.model_no,
                mrp:           parseFloat(p.mrp || 0),
                selling_price: parseFloat(p.selling_price || 0),
                brand:         brandMap[p.brand_id] || '',
                image:         p.main_image || null,
                variants:      (varsByProduct[p.product_id] || []).map(v => ({
                    variant_id: v.variant_id,
                    color_code: v.color_code,
                    size_code:  v.size_code,
                    sku:        v.sku,
                    stock:      v.stock,
                    label:      [v.color_code, v.size_code].filter(Boolean).join(' / ') || v.sku || v.variant_id
                }))
            }));

        res.json({ success: true, data });
    } catch (err) {
        console.error('[products/search error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/products/import-logs
router.get('/import-logs', auth, async (req, res) => {

    try {
        const { rows } = await db.query(
            `SELECT * FROM import_log WHERE business_id=$1 ORDER BY created_at DESC LIMIT 20`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.json({ success: true, data: [] }); // Graceful fallback
    }
});

// GET /api/products/fetch-upc/:code
router.get('/fetch-upc/:code', auth, async (req, res) => {
    const code = req.params.code;
    try {
        const { rows } = await db.query(
            `SELECT p.*, b.name AS brand_name
             FROM product p
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.upc_code = $1 AND p.business_id = $2
             LIMIT 1`,
            [code, req.user.business_id]
        );
        if (rows[0]) {
            return res.json({ success: true, product: rows[0], source: 'internal' });
        }
        res.json({ success: false, error: 'Product not found in system' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/products/classify (AI stub)
router.post('/classify', auth, async (req, res) => {
    const { name, brand_name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Product name required' });
    // Return empty suggestions (extend with real AI if needed)
    res.json({ success: true, suggestions: {} });
});

// POST /api/products/bulk-delete
router.post('/bulk-delete', auth, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, error: 'No IDs provided' });
    try {
        await db.query('BEGIN');
        // Delete all inventory for variants attached to these products
        await db.query(`
            DELETE FROM inventory 
            WHERE variant_id IN (
                SELECT variant_id FROM variant WHERE product_id = ANY($1)
            )
        `, [ids]);
        
        // Delete all variants for these products
        await db.query(`DELETE FROM variant WHERE product_id = ANY($1)`, [ids]);
        
        // Delete the products
        await db.query(`DELETE FROM product WHERE product_id = ANY($1) AND business_id = $2`, [ids, req.user.business_id]);
        
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/products/bulk-validate (Excel upload validation)
router.post('/bulk-validate', auth, upload.single('file'), async (req, res) => {
    try {
        const xlsx = require('xlsx');
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { defval: '' });

        const biz = req.user.business_id;

        // Fetch all master data directly via Supabase (not proxy)
        const [{ data: brands }, { data: frameTypes }, { data: materials }, { data: genders }, { data: categories }] = await Promise.all([
            supabase.from('brands').select('id,name').eq('business_id', biz),
            supabase.from('frame_types').select('id,name').eq('business_id', biz),
            supabase.from('materials').select('id,name').eq('business_id', biz),
            supabase.from('genders').select('id,name').eq('business_id', biz),
            supabase.from('categories').select('id,name').eq('business_id', biz)
        ]);

        // Build case-insensitive maps with fuzzy fallback (strip hyphens/spaces)
        const normalize = s => String(s || '').toUpperCase().replace(/[-\s]+/g, '');
        const brandMap  = Object.fromEntries((brands || []).flatMap(b => [[b.name.toUpperCase(), b.id], [normalize(b.name), b.id]]));
        const ftMap     = Object.fromEntries((frameTypes || []).flatMap(f => [[f.name.toUpperCase(), f.id], [normalize(f.name), f.id]]));
        const matMap    = Object.fromEntries((materials || []).flatMap(m => [[m.name.toUpperCase(), m.id], [normalize(m.name), m.id]]));
        const genderMap = Object.fromEntries((genders || []).flatMap(g => [[g.name.toUpperCase(), g.id], [normalize(g.name), g.id]]));
        const catMap    = Object.fromEntries((categories || []).flatMap(c => [[c.name.toUpperCase(), c.id], [normalize(c.name), c.id]]));

        let errorCount = 0;
        const preview = data.map((row, idx) => {
            const errors = [];
            const brand_raw  = String(row['Brand'] || '').trim();
            const brand_key  = brand_raw.toUpperCase();
            const brand_norm = normalize(brand_raw);
            const brand_id   = brandMap[brand_key] || brandMap[brand_norm] || null;

            if (!brand_raw)   errors.push('Missing Brand');
            else if (!brand_id) errors.push(`Brand "${row['Brand']}" not in master data`);
            if (!row['Model No']) errors.push('Missing Model No');
            if (!row['MRP'] || isNaN(row['MRP'])) errors.push('Invalid or missing MRP');

            const isValid = errors.length === 0;
            if (!isValid) errorCount++;

            return {
                ...row,
                _rowId:         idx + 2,
                _brand_id:      brand_id,
                _frame_type_id: ftMap[String(row['Frame Type']||'').toUpperCase()]     || ftMap[normalize(row['Frame Type'])]     || null,
                _material_id:   matMap[String(row['Frame Material']||'').toUpperCase()] || matMap[normalize(row['Frame Material'])] || null,
                _gender_id:     genderMap[String(row['Gender']||'').toUpperCase()]      || genderMap[normalize(row['Gender'])]      || null,
                _category_id:   catMap[String(row['Category']||'').toUpperCase()]       || catMap[normalize(row['Category'])]       || null,
                isValid,
                errors: errors.join('; ')
            };
        });

        res.json({ success: true, preview, total: preview.length, errorCount });
    } catch (err) {
        console.error('[bulk-validate error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/products/bulk-import-save
router.post('/bulk-import-save', auth, async (req, res) => {
    const { showroom_id, products } = req.body;
    const biz = req.user.business_id;
    if (!products || !products.length) return res.status(400).json({ success: false, error: 'No products' });

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    let imported = 0;
    const errors = [];

    for (const row of products) {
        if (!row.isValid) { errors.push({ rowId: row._rowId, reason: row.errors || 'Validation failed' }); continue; }

        try {
            // 1. Find or create product (brand + model is unique key)
            const { data: existingProds } = await supabase
                .from('product')
                .select('product_id')
                .eq('business_id', biz)
                .eq('brand_id', row._brand_id)
                .eq('model_no', row['Model No'])
                .limit(1);

            let pid;
            if (existingProds && existingProds[0]) {
                pid = existingProds[0].product_id;
            } else {
                pid = `prod_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                const productName = row['Product Name'] || `${row['Brand']} ${row['Model No']}`;
                const { error: pErr } = await supabase.from('product').insert({
                    product_id:     pid,
                    business_id:    biz,
                    product_name:   productName,
                    brand_id:       row._brand_id,
                    model_no:       row['Model No'],
                    mrp:            parseFloat(row['MRP']) || 0,
                    selling_price:  parseFloat(row['Selling Price'] || row['MRP']) || 0,
                    upc_code:       row['UPC Code'] || null,
                    category_id:    row._category_id || null,
                    frame_type_id:  row._frame_type_id || null,
                    material_id:    row._material_id || null,
                    gender_id:      row._gender_id || null,
                    is_published:   false,
                    active_status:  true
                });
                if (pErr) throw new Error(`Product insert: ${pErr.message}`);
            }

            // 2. Find or create variant
            const { data: existingVars } = await supabase
                .from('variant')
                .select('variant_id')
                .eq('product_id', pid)
                .eq('color_code', row['Color Code'] || '')
                .eq('size_code', row['Size Code'] || '')
                .limit(1);

            let vid;
            if (existingVars && existingVars[0]) {
                vid = existingVars[0].variant_id;
            } else {
                vid = `var_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                const sku = `${String(row['Brand']||'').toUpperCase()}-${String(row['Model No']||'').toUpperCase()}-${String(row['Color Code']||'').toUpperCase() || Date.now()}-${Math.random().toString(36).slice(2,6)}`.slice(0, 100);
                const { error: vErr } = await supabase.from('variant').insert({
                    variant_id: vid,
                    product_id: pid,
                    color_code: row['Color Code'] || '',
                    size_code:  row['Size Code']  || '',
                    sku
                });
                if (vErr) throw new Error(`Variant insert: ${vErr.message}`);
            }

            // 3. Upsert inventory
            if (showroom_id) {
                const { data: existingInv } = await supabase
                    .from('inventory')
                    .select('inventory_id, available_qty')
                    .eq('variant_id', vid)
                    .eq('showroom_id', showroom_id)
                    .limit(1);

                const qty = parseInt(row['Qty']) || 0;
                if (existingInv && existingInv[0]) {
                    await supabase.from('inventory').update({
                        available_qty: existingInv[0].available_qty + qty,
                        last_updated:  new Date().toISOString()
                    }).eq('inventory_id', existingInv[0].inventory_id);
                } else {
                    await supabase.from('inventory').insert({
                        inventory_id:  `inv_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                        business_id:   biz,
                        product_id:    pid,
                        variant_id:    vid,
                        showroom_id,
                        available_qty: qty
                    });
                }
            }

            imported++;
        } catch (rowErr) {
            errors.push({ rowId: row._rowId, reason: rowErr.message });
        }
    }

    // Write import log
    try {
        await supabase.from('import_log').insert({
            business_id:   biz,
            file_name:     `bulk_import_${new Date().toISOString().slice(0,10)}.xlsx`,
            total_rows:    products.length,
            success_rows:  imported,
            failed_rows:   errors.length,
            uploaded_by:   req.user.user_id || req.user.id || 'unknown'
        });
    } catch (_) { /* log write is non-critical */ }

    res.json({ success: true, imported_count: imported, failed_count: errors.length, errors });
});


// POST /api/products/quick-entry — smart create or update: product + variant + inventory
router.post('/quick-entry', auth, async (req, res) => {
    const {
        product_name, brand_id, model_no, color_code, size_code, frame_type_id, material_id,
        gender_id, qty, mrp, showroom_id, upc_code, category_id, shape_id
    } = req.body;

    if (!brand_id || !model_no) return res.status(400).json({ success: false, error: 'Brand and Model No are required' });

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const biz = req.user ? req.user.business_id : 'biz_blink_001';

    try {
        // 1. Find or create product
        const { data: existingProds } = await supabase.from('product')
            .select('product_id,product_name')
            .eq('business_id', biz).eq('brand_id', brand_id).eq('model_no', model_no)
            .limit(1);

        let pid;
        if (existingProds?.[0]) {
            pid = existingProds[0].product_id;
            // Update fields if missing
            await supabase.from('product').update({
                mrp: parseFloat(mrp) || 0,
                selling_price: parseFloat(mrp) || 0,
                ...(category_id   && { category_id }),
                ...(gender_id     && { gender_id }),
                ...(frame_type_id && { frame_type_id }),
                ...(material_id   && { material_id }),
                ...(shape_id      && { shape_id }),
            }).eq('product_id', pid);
        } else {
            pid = `prod_${Date.now()}`;
            // Resolve brand name for auto-generated product name
            const { data: brData } = await supabase.from('brands').select('name').eq('id', brand_id).single();
            const brandName = brData?.name || '';
            const finalName = product_name || `${brandName} ${model_no}`.trim();

            const { error: pErr } = await supabase.from('product').insert({
                product_id: pid, business_id: biz, product_name: finalName,
                brand_id, model_no, category_id: category_id||null,
                gender_id: gender_id||null, frame_type_id: frame_type_id||null,
                shape_id: shape_id||null, material_id: material_id||null,
                mrp: parseFloat(mrp)||0, selling_price: parseFloat(mrp)||0,
                upc_code: upc_code||null, is_published: false, active_status: true
            });
            if (pErr) throw new Error(`Product insert failed: ${pErr.message}`);
        }

        // 2. Find or create variant
        const { data: existingVars } = await supabase.from('variant')
            .select('variant_id')
            .eq('product_id', pid)
            .eq('color_code', color_code || '')
            .eq('size_code',  size_code  || '')
            .limit(1);

        let vid;
        if (existingVars?.[0]) {
            vid = existingVars[0].variant_id;
        } else {
            vid = `var_${Date.now()}`;
            const { data: brData } = await supabase.from('brands').select('name').eq('id', brand_id).single();
            const brandName = brData?.name || 'UNKNOWN';
            const sku = `${brandName.toUpperCase()}-${model_no.toUpperCase()}-${(color_code||'').toUpperCase()}-${Date.now()}`.slice(0, 100);

            const { error: vErr } = await supabase.from('variant').insert({
                variant_id: vid, product_id: pid,
                color_code: color_code||'', size_code: size_code||'', sku
            });
            if (vErr) throw new Error(`Variant insert failed: ${vErr.message}`);
        }

        // 3. Upsert inventory (additive qty)
        if (showroom_id) {
            const { data: existingInv } = await supabase.from('inventory')
                .select('inventory_id,available_qty')
                .eq('variant_id', vid).eq('showroom_id', showroom_id).limit(1);

            if (existingInv?.[0]) {
                await supabase.from('inventory').update({
                    available_qty: (existingInv[0].available_qty || 0) + (parseInt(qty) || 1)
                }).eq('inventory_id', existingInv[0].inventory_id);
            } else {
                await supabase.from('inventory').insert({
                    inventory_id: `inv_${Date.now()}`,
                    business_id: biz, product_id: pid, variant_id: vid,
                    showroom_id, available_qty: parseInt(qty) || 1
                });
            }
        }

        res.status(201).json({ success: true, product_id: pid, variant_id: vid });
    } catch (err) {
        console.error('[quick-entry error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/products/variants/:id
router.delete('/variants/:id', auth, async (req, res) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    try {
        await supabase.from('inventory').delete().eq('variant_id', req.params.id);
        await supabase.from('variant').delete().eq('variant_id', req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ─── MAIN PRODUCT LIST ────────────────────────────────────────────────────────

// GET /api/products — Proxy v48 handles enrichment (brand, variant, inventory)
router.get('/', async (req, res) => {
    try {
        const {
            business_id, search, brand_id, gender_id, category_id, frame_type_id,
            color_code, size_code, min_price, max_price, is_published,
            include_inactive, in_stock, showroom_id, limit = 200, offset = 0
        } = req.query;

        const biz = business_id || (req.user && req.user.business_id) || 'biz_blink_001';
        const params = [biz];
        if (showroom_id) params.push(showroom_id);
        if (search)      params.push(`%${search}%`);
        params.push(parseInt(limit), parseInt(offset));

        // Proxy v48 Product Handler does all JOINs in-memory
        const { rows: allRows } = await db.query(
            `SELECT * FROM product WHERE business_id = $1 ORDER BY product_name ASC`,
            params
        );

        // Apply JS-side filters
        let rows = allRows;
        if (!include_inactive || include_inactive === 'false') rows = rows.filter(p => p.active_status !== false);
        if (is_published !== undefined && is_published !== '')  rows = rows.filter(p => String(p.is_published) === is_published);
        if (search)       { const t = search.toLowerCase(); rows = rows.filter(p => (p.product_name||'').toLowerCase().includes(t) || (p.model_no||'').toLowerCase().includes(t) || (p.brand_name||'').toLowerCase().includes(t) || (p.variant_sku||'').toLowerCase().includes(t)); }
        if (brand_id)      rows = rows.filter(p => p.brand_id      === brand_id);
        if (gender_id)     rows = rows.filter(p => p.gender_id     === gender_id);
        if (category_id)   rows = rows.filter(p => p.category_id   === category_id);
        if (frame_type_id) rows = rows.filter(p => p.frame_type_id === frame_type_id);
        if (color_code)    rows = rows.filter(p => (p.color_code||'').toLowerCase().includes(color_code.toLowerCase()));
        if (size_code)     rows = rows.filter(p => (p.size_code||'').toLowerCase().includes(size_code.toLowerCase()));
        if (min_price)     rows = rows.filter(p => parseFloat(p.mrp||0) >= parseFloat(min_price));
        if (max_price)     rows = rows.filter(p => parseFloat(p.mrp||0) <= parseFloat(max_price));
        if (in_stock === 'true') rows = rows.filter(p => (p.total_stock || 0) > 0);
        if (showroom_id)   rows = rows.filter(p => !p.total_stock || p.total_stock > 0); // showroom filter already applied in proxy

        const lim = parseInt(limit); const off = parseInt(offset);
        res.json({ success: true, data: rows.slice(off, off + lim), total: rows.length });
    } catch (err) {
        console.error('[products GET error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch products: ' + err.message });
    }
});


// ─── SINGLE PRODUCT ───────────────────────────────────────────────────────────

// GET /api/products/:id — full product with all variants and inventory
router.get('/:id', async (req, res) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    try {
        // Fetch product via proxy (gets enriched brand/category/etc names)
        const { rows } = await db.query(
            `SELECT * FROM product WHERE product_id = $1`,
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, error: 'Product not found' });

        // Fetch all variants for this product
        const { data: variantsRaw } = await supabase.from('variant').select('*').eq('product_id', req.params.id).order('created_at', { ascending: true });
        // Fetch inventory for each variant
        const { data: invAll } = await supabase.from('inventory').select('*').eq('product_id', req.params.id);
        const { data: showrooms } = await supabase.from('showroom').select('showroom_id,showroom_name').eq('business_id', rows[0].business_id);
        const sMap = Object.fromEntries((showrooms||[]).map(s => [s.showroom_id, s.showroom_name]));

        const variants = (variantsRaw || []).map(v => {
            const vInv = (invAll || []).filter(i => i.variant_id === v.variant_id);
            return {
                ...v,
                total_stock: vInv.reduce((a, i) => a + (i.available_qty || 0), 0),
                showroom_id: vInv[0]?.showroom_id || null,
                showroom_name: sMap[vInv[0]?.showroom_id] || null,
                inventory: vInv
            };
        });

        res.json({ success: true, data: { ...rows[0], variants } });
    } catch (err) {
        console.error('[product GET/:id error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
});

// POST /api/products — create blank product
router.post('/', auth, async (req, res) => {
    const biz = req.user.business_id;
    const pid = `prod_${Date.now()}`;
    const {
        product_name, model_no, brand_id, category_id, gender_id,
        frame_type_id, shape_id, material_id, mrp, selling_price, upc_code
    } = req.body;
    try {
        const { rows } = await db.query(
            `INSERT INTO product (product_id, business_id, product_name, model_no, brand_id, category_id,
             gender_id, frame_type_id, shape_id, material_id, mrp, selling_price, upc_code, is_published, active_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,true) RETURNING *`,
            [pid, biz, product_name, model_no, brand_id, category_id,
             gender_id, frame_type_id, shape_id, material_id,
             parseFloat(mrp)||0, parseFloat(selling_price) || parseFloat(mrp) || 0, upc_code||null]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[product create error]', err.message);
        res.status(500).json({ success: false, error: 'Product creation failed: ' + err.message });
    }
});

// PUT /api/products/:id — THE KEY FIX: routes fields to correct tables
// ─────────────────────────────────────────────────────────────────────────────
// Fields in the Edit Standard Product form:
//   product_name, upc_code, brand_id, model_no → product table
//   color_code, size_code                       → variant table (primary variant)
//   frame_type_id, material_id, gender_id, mrp  → product table
//   qty                                          → inventory table (available_qty)
//   showroom_id                                  → inventory table
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
    const productId = req.params.id;
    const body      = req.body;

    // Auto store MRP value in Selling Price field if selling price is missing/empty
    if (body.mrp !== undefined && !body.selling_price) {
        body.selling_price = body.mrp;
    }

    // Separate fields by their target table
    const productFields = {};
    const variantFields = {};
    let   qty        = undefined;
    let   showroom_id = body.showroom_id;

    for (const [key, val] of Object.entries(body)) {
        if (key === 'product_id' || key === 'business_id') continue; // never update PK / biz
        if (key === 'qty')         { qty = parseInt(val);  continue; }
        if (key === 'showroom_id') {                        continue; } // handled via inventory only

        let safeVal = val;

        // Empty string → null to prevent constraint violations
        if (val === '' || val === undefined) { safeVal = null; }

        // NaN guard for numerics
        if (typeof safeVal === 'number' && isNaN(safeVal)) { safeVal = null; }

        // Handle postgres JSONB columns (pass as JSON string) vs text[] columns (leave as array)
        if (Array.isArray(safeVal)) {
            if (key === 'additional_images' || key === 'vto_config') {
                safeVal = JSON.stringify(safeVal);
            }
            // 'tags' column is text[] — the pg driver can handle a JavaScript array natively
        }

        if (VARIANT_COLS.has(key)) { variantFields[key] = safeVal; continue; }
        if (PRODUCT_COLS.has(key)) { productFields[key] = safeVal; continue; }
        // Unknown field — skip silently
    }

    try {
        await db.query('BEGIN');

        // 1. Update product table
        if (Object.keys(productFields).length > 0) {
            const setCols  = Object.keys(productFields);
            const setVals  = Object.values(productFields);
            const setClause = setCols.map((c, idx) => `${c} = $${idx + 2}`).join(', ');
            await db.query(
                `UPDATE product SET ${setClause} WHERE product_id = $1`,
                [productId, ...setVals]
            );
        }

        // 2. Update primary variant (color_code, size_code)
        if (Object.keys(variantFields).length > 0) {
            // Get the first (primary) variant for this product
            const { rows: vRows } = await db.query(
                `SELECT variant_id FROM variant WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`,
                [productId]
            );
            if (vRows.length > 0) {
                const vid      = vRows[0].variant_id;
                const vCols    = Object.keys(variantFields);
                const vVals    = Object.values(variantFields);
                const vClause  = vCols.map((c, idx) => `${c} = $${idx + 2}`).join(', ');
                await db.query(
                    `UPDATE variant SET ${vClause} WHERE variant_id = $1`,
                    [vid, ...vVals]
                );

                // 3. Update inventory qty if provided
                if (qty !== undefined && showroom_id) {
                    await db.query(
                        `UPDATE inventory SET available_qty = $1, last_updated = NOW()
                         WHERE variant_id = $2 AND showroom_id = $3`,
                        [qty, vid, showroom_id]
                    );
                }
            }
        } else if (qty !== undefined && showroom_id) {
            // qty change with no variant field changes → still update inventory
            const { rows: vRows } = await db.query(
                `SELECT variant_id FROM variant WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`,
                [productId]
            );
            if (vRows.length > 0) {
                await db.query(
                    `UPDATE inventory SET available_qty = $1, last_updated = NOW()
                     WHERE variant_id = $2 AND showroom_id = $3`,
                    [qty, vRows[0].variant_id, showroom_id]
                );
            }
        }

        await db.query('COMMIT');

        // Return updated product with fresh joins
        const { rows } = await db.query(`
            SELECT p.*,
                   b.name  AS brand_name,
                   ft.name AS frame_type_name,
                   g.name  AS gender_name,
                   m.name  AS material_name
            FROM product p
            LEFT JOIN brands      b   ON p.brand_id      = b.id
            LEFT JOIN frame_types ft  ON p.frame_type_id = ft.id
            LEFT JOIN genders     g   ON p.gender_id     = g.id
            LEFT JOIN materials   m   ON p.material_id   = m.id
            WHERE p.product_id = $1
        `, [productId]);

        res.json({ success: true, data: rows[0] });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[product PUT error]', err.message, err.stack);
        res.status(500).json({ success: false, error: 'Product update failed: ' + err.message });
    }
});

// PATCH /api/products/:id/publish
router.patch('/:id/publish', auth, async (req, res) => {
    try {
        await db.query(`UPDATE product SET is_published = true WHERE product_id = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/products/:id/unpublish
router.patch('/:id/unpublish', auth, async (req, res) => {
    try {
        await db.query(`UPDATE product SET is_published = false WHERE product_id = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/products/:id/variants — add variant to existing product
router.post('/:id/variants', auth, async (req, res) => {
    const productId = req.params.id;
    const { color_code, size_code, sku, variant_price } = req.body;

    if (!color_code || !size_code) return res.status(400).json({ success: false, error: 'color_code and size_code are required' });

    const vid = `var_${Date.now()}`;
    let autoSku = sku;

    if (!autoSku) {
        const { rows: pr } = await db.query(
            `SELECT p.model_no, b.name AS brand_name FROM product p LEFT JOIN brands b ON p.brand_id=b.id WHERE p.product_id=$1`,
            [productId]
        );
        const p = pr[0] || {};
        autoSku = `${(p.brand_name||'').toUpperCase()}-${(p.model_no||'').toUpperCase()}-${color_code.toUpperCase()}-${size_code.toUpperCase()}`.slice(0, 100);
    }

    try {
        await db.query(
            `INSERT INTO variant (variant_id, product_id, color_code, size_code, sku, variant_price)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [vid, productId, color_code, size_code, autoSku, variant_price ? parseFloat(variant_price) : null]
        );
        res.status(201).json({ success: true, variant_id: vid });
    } catch (err) {
        console.error('[variants POST error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/products/:id — hard delete (cascades to variants + inventory)
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.query('BEGIN');
        const { rows: variants } = await db.query(`SELECT variant_id FROM variant WHERE product_id=$1`, [req.params.id]);
        for (const v of variants) {
            await db.query(`DELETE FROM inventory WHERE variant_id=$1`, [v.variant_id]);
        }
        await db.query(`DELETE FROM variant WHERE product_id=$1`, [req.params.id]);
        await db.query(`DELETE FROM product WHERE product_id=$1 AND business_id=$2`, [req.params.id, req.user.business_id]);
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[product DELETE error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
