// routes/public.routes.js — Public Storefront API (Supabase direct)
const express = require('express');
const router  = express.Router();
const xlsx    = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// ── Health Check ──────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── GET /api/public/download-template ────────────────────────────────
router.get('/download-template', (req, res) => {
    try {
        const data = [
            { 'Brand': 'Ray-Ban', 'Category': 'Eyeglasses', 'Model No': 'RB3025', 'UPC Code': '829576019311', 'Frame Type': 'Full Rim', 'Color Code': '001/51', 'Size Code': '58-14', 'Frame Material': 'Metal', 'Gender': 'Unisex', 'Qty': 10, 'MRP': 9500 },
            { 'Brand': 'Oakley',  'Category': 'Sunglasses',  'Model No': 'Holbrook', 'UPC Code': '888392100000', 'Frame Type': 'Full Rim', 'Color Code': 'Black', 'Size Code': 'Standard', 'Frame Material': 'Plastic', 'Gender': 'Male', 'Qty': 5, 'MRP': 12000 }
        ];
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), 'Template');
        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=blink_product_import_v7_MASTER.xlsx');
        res.send(buf);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/public/catalog-public ───────────────────────────────────
// Fetches published + active products, enriched with brand/category/gender/type/shape/material
// and the best active offer for each product — all via Supabase, no SQL proxy.
router.get('/catalog-public', async (req, res) => {
    const supabase = getSupabase();
    try {
        // 1. Fetch published, active products with a selling price
        const { data: products, error: pErr } = await supabase
            .from('product')
            .select(`
                product_id, product_name, selling_price, mrp, model_no, upc_code, tags,
                brand_id, category_id, gender_id, frame_type_id, shape_id, material_id,
                is_published, active_status,
                lens_composite, lens_colorway,
                lens_width, bridge_size, temple_length,
                main_image, additional_images,
                description, short_description,
                created_at
            `)
            .eq('is_published', true)
            .eq('active_status', true)
            .gt('selling_price', 0)
            .order('created_at', { ascending: false })
            .limit(100);

        if (pErr) throw new Error('Products: ' + pErr.message);
        if (!products || products.length === 0) return res.json({ success: true, data: [] });

        // 2. Collect unique FK IDs for lookup tables
        const brandIds    = [...new Set(products.map(p => p.brand_id).filter(Boolean))];
        const catIds      = [...new Set(products.map(p => p.category_id).filter(Boolean))];
        const genderIds   = [...new Set(products.map(p => p.gender_id).filter(Boolean))];
        const ftypeIds    = [...new Set(products.map(p => p.frame_type_id).filter(Boolean))];
        const shapeIds    = [...new Set(products.map(p => p.shape_id).filter(Boolean))];
        const materialIds = [...new Set(products.map(p => p.material_id).filter(Boolean))];

        // 3. Parallel lookup fetches
        const [brandsRes, catsRes, gendersRes, ftRes, shapeRes, matRes, offersRes] = await Promise.all([
            brandIds.length    ? supabase.from('brands').select('id,name,logo,description').in('id', brandIds) : { data: [] },
            catIds.length      ? supabase.from('categories').select('id,name').in('id', catIds)               : { data: [] },
            genderIds.length   ? supabase.from('genders').select('id,name').in('id', genderIds)               : { data: [] },
            ftypeIds.length    ? supabase.from('frame_types').select('id,name').in('id', ftypeIds)            : { data: [] },
            shapeIds.length    ? supabase.from('shapes').select('id,name').in('id', shapeIds)                 : { data: [] },
            materialIds.length ? supabase.from('materials').select('id,name').in('id', materialIds)           : { data: [] },
            // Fetch all currently active offers (JS-side date check)
            supabase.from('offer').select('offer_name,offer_type,discount_value,apply_on,apply_target,start_date,end_date').eq('active_status', true)
        ]);

        // 4. Build lookup maps
        const brandMap    = Object.fromEntries((brandsRes.data  || []).map(x => [x.id, x]));
        const catMap      = Object.fromEntries((catsRes.data    || []).map(x => [x.id, x.name]));
        const genderMap   = Object.fromEntries((gendersRes.data || []).map(x => [x.id, x.name]));
        const ftypeMap    = Object.fromEntries((ftRes.data      || []).map(x => [x.id, x.name]));
        const shapeMap    = Object.fromEntries((shapeRes.data   || []).map(x => [x.id, x.name]));
        const matMap      = Object.fromEntries((matRes.data     || []).map(x => [x.id, x.name]));

        // 5. Filter offers to currently active ones
        const now = new Date();
        const activeOffers = (offersRes.data || []).filter(o => {
            if (!o.start_date || !o.end_date) return false;
            return new Date(o.start_date) <= now && new Date(o.end_date) >= now;
        });

        // Helper: find best offer for a product
        function bestOffer(product) {
            const pid  = product.product_id;
            const pname = product.product_name;
            const cid  = product.category_id;
            const cname = catMap[cid] || '';
            const bid  = product.brand_id;
            const bname = brandMap[bid]?.name || '';

            // Priority: product > category > brand > full cart > all
            const priority = { product: 1, Category: 2, Brand: 3, 'Full cart': 4, all: 5 };
            const matching = activeOffers
                .filter(o => {
                    if (o.apply_on === 'product')    return o.apply_target === pid || o.apply_target === pname;
                    if (o.apply_on === 'Category')   return o.apply_target === cid || o.apply_target === cname;
                    if (o.apply_on === 'Brand')      return o.apply_target === bid || o.apply_target === bname;
                    if (o.apply_on === 'Full cart')  return true;
                    if (o.apply_on === 'all')        return true;
                    return false;
                })
                .sort((a, b) => {
                    const pa = priority[a.apply_on] || 9;
                    const pb = priority[b.apply_on] || 9;
                    if (pa !== pb) return pa - pb;
                    return parseFloat(b.discount_value) - parseFloat(a.discount_value);
                });
            return matching[0] || null;
        }

        // 6. Enrich each product
        const enriched = products.map(p => {
            const brand   = brandMap[p.brand_id] || {};
            const offer   = bestOffer(p);
            return {
                id:           p.product_id,
                name:         p.product_name,
                price:        parseFloat(p.selling_price || 0),
                mrp:          parseFloat(p.mrp || 0),
                model_no:     p.model_no,
                sku:          p.upc_code,
                tags:         p.tags,
                brand:        brand.name        || '',
                brand_logo:   brand.logo        || '',
                brand_desc:   brand.description || '',
                category:     catMap[p.category_id]   || '',
                gender:       genderMap[p.gender_id]   || '',
                type:         ftypeMap[p.frame_type_id] || '',
                shape:        shapeMap[p.shape_id]      || '',
                material:     matMap[p.material_id]     || '',
                lens_composite: p.lens_composite,
                lens_colorway:  p.lens_colorway,
                lens_width:     p.lens_width,
                bridge_size:    p.bridge_size,
                temple_length:  p.temple_length,
                image:   p.main_image || 'https://placehold.co/600x600/fcfcfc/cccccc?text=Image+Pending',
                additional_images: p.additional_images,
                desc:       p.description,
                short_desc: p.short_description,
                offer_name:     offer?.offer_name     || null,
                offer_type:     offer?.offer_type     || null,
                offer_discount: offer?.discount_value || null
            };
        });

        res.json({ success: true, data: enriched });
    } catch (err) {
        console.error('[catalog-public error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/public/coupons-public ───────────────────────────────────
router.get('/coupons-public', async (req, res) => {
    const supabase = getSupabase();
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('coupon')
            .select('code,coupon_type,discount_type,discount_value,min_order_value,expiry_date')
            .eq('active_status', true)
            .gte('expiry_date', today)
            .order('discount_value', { ascending: false })
            .limit(5);
        if (error) throw new Error(error.message);
        res.json({ success: true, data: data || [] });
    } catch (err) {
        console.error('[coupons-public error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/public/settings-public ──────────────────────────────────
router.get('/settings-public', async (req, res) => {
    const supabase = getSupabase();
    try {
        const { data, error } = await supabase
            .from('business_settings')
            .select('setting_key,setting_value')
            .in('setting_key', ['general_settings', 'gst_settings']);
        if (error) throw new Error(error.message);
        const settings = {};
        (data || []).forEach(r => settings[r.setting_key] = r.setting_value);
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('[settings-public error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Master Data Navigation Endpoints ─────────────────────────────────
const MASTER_TABLES = [
    { route: 'brands',      table: 'brands',      cols: 'id,name,slug,logo,hero_url' },
    { route: 'categories',  table: 'categories',  cols: 'id,name,slug' },
    { route: 'genders',     table: 'genders',     cols: 'id,name,slug' },
    { route: 'frame_types', table: 'frame_types', cols: 'id,name,slug' },
    { route: 'shapes',      table: 'shapes',      cols: 'id,name,slug' },
    { route: 'materials',   table: 'materials',   cols: 'id,name,slug' },
    { route: 'frame_colors',table: 'frame_colors',cols: 'id,name,slug' }
];

MASTER_TABLES.forEach(({ route, table, cols }) => {
    router.get(`/${route}`, async (req, res) => {
        const supabase = getSupabase();
        try {
            const { data, error } = await supabase
                .from(table)
                .select(cols)
                .eq('active_status', true)
                .order('name', { ascending: true });
            if (error) throw new Error(error.message);
            res.json({ success: true, data: data || [] });
        } catch (err) {
            console.error(`[public/${route} error]`, err.message);
            // Graceful fallback — return empty instead of 500 so menus don't break
            res.json({ success: true, data: [] });
        }
    });
});

// ── GET /api/public/cms/page/:slug ───────────────────────────────────
router.get('/cms/page/:slug', async (req, res) => {
    const supabase = getSupabase();
    const { slug } = req.params;
    try {
        const { data: pages, error: pgErr } = await supabase
            .from('pages')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .limit(1);
        if (pgErr) throw new Error(pgErr.message);
        if (!pages || pages.length === 0) return res.status(404).json({ success: false, error: 'Page not found' });

        const page = pages[0];
        const [seoRes, secRes] = await Promise.all([
            supabase.from('page_seo').select('*').eq('page_id', page.id).limit(1),
            supabase.from('page_sections').select('*').eq('page_id', page.id).eq('status', 'published').order('section_order', { ascending: true })
        ]);

        res.json({
            success: true,
            data: {
                ...page,
                seo:      seoRes.data?.[0] || {},
                sections: secRes.data      || []
            }
        });
    } catch (err) {
        console.error('[cms/page error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
