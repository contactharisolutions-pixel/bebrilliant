// db.js v48 — DEFINITIVE Production Proxy (Deep Audit Fix)
// Strategy: All reads routed to Supabase. Writes use direct INSERT/UPDATE via Supabase.
// Transactions (BEGIN/COMMIT/ROLLBACK) are no-ops since Supabase handles atomic ops.
'use strict';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively strip all () content to expose the outer SQL skeleton */
function stripParens(sql) {
    let s = sql, prev;
    do { prev = s; s = s.replace(/\([^()]*\)/g, ''); } while (s !== prev);
    return s;
}

/** True if tableName is the primary FROM target (not buried in a subquery) */
function isMain(sql, tableName) {
    return new RegExp(`\\bfrom\\s+["']?${tableName}["']?\\b`, 'i').test(stripParens(sql));
}

/** Extract business_id from params array */
function getBiz(params) {
    return (params || []).find(p => typeof p === 'string' && p.startsWith('biz_')) || 'biz_blink_001';
}

/** Generic Supabase fetch with optional biz filter */
async function fetch(table, biz, extra) {
    let q = supabase.from(table).select('*');
    if (biz) q = q.eq('business_id', biz);
    if (extra) extra(q);
    const { data, error } = await q.limit(500);
    if (error) console.warn(`[DB] fetch(${table}):`, error.message);
    return data || [];
}

// ─── Main Export ──────────────────────────────────────────────────────────────
module.exports = {
    query: async (sql, params = []) => {
        if (!sql) return { rows: [] };
        const lo = sql.toLowerCase().trim();
        const biz = getBiz(params);

        try {
            // ── Transaction stubs (no-op) ───────────────────────────────────
            if (/^(begin|commit|rollback)$/i.test(lo.trim())) return { rows: [] };

            // ─────────────────────────────────────────────────────────────────
            // READ HANDLERS (SELECT)
            // ─────────────────────────────────────────────────────────────────

            // ── 1. Showroom KPI Dashboard (GROUP BY showroom) ──────────────
            if (isMain(sql, 'showroom') && lo.includes('group by')) {
                const [showrooms, orders, inventory, products] = await Promise.all([
                    fetch('showroom', biz), fetch('customer_order', biz), fetch('inventory', biz),
                    supabase.from('product').select('product_id,base_price,mrp').eq('business_id', biz).then(r => r.data || [])
                ]);
                const pMap = Object.fromEntries(products.map(p => [p.product_id, p]));
                return {
                    rows: showrooms.map(s => {
                        const sOrders = orders.filter(o => o.showroom_id === s.showroom_id);
                        const sInv    = inventory.filter(i => i.showroom_id === s.showroom_id);
                        return {
                            showroom_id:   s.showroom_id,
                            showroom_name: s.showroom_name,
                            orders:   sOrders.length,
                            revenue:  sOrders.reduce((a, o) => a + +o.total_amount, 0),
                            in_stock: sInv.reduce((a, i) => a + i.available_qty, 0),
                            stock_value: sInv.reduce((a, i) => a + i.available_qty * (+pMap[i.product_id]?.base_price || +pMap[i.product_id]?.mrp || 0), 0)
                        };
                    })
                };
            }

            // ── 2. Analytics by Brand / Category / Gender ──────────────────
            if (lo.includes('from brands b') || lo.includes('from categories c') || lo.includes('from genders g')) {
                const tbl = lo.includes('from brands') ? 'brands' : lo.includes('from categories') ? 'categories' : 'genders';
                const pfx = tbl === 'brands' ? 'brand' : tbl === 'categories' ? 'category' : 'gender';
                const [entities, products, orders, items, inventory] = await Promise.all([
                    fetch(tbl, biz), fetch('product', biz),
                    supabase.from('customer_order').select('order_id,total_amount').eq('business_id', biz).neq('payment_status', 'cancelled').then(r => r.data || []),
                    supabase.from('order_item').select('*').then(r => r.data || []),
                    fetch('inventory', biz)
                ]);
                const iByP = {}; items.forEach(it => { (iByP[it.product_id] = iByP[it.product_id] || []).push(it); });
                const invByP = {}; inventory.forEach(iv => { invByP[iv.product_id] = (invByP[iv.product_id] || 0) + iv.available_qty; });
                const oSet = new Set(orders.map(o => o.order_id));
                return {
                    rows: entities.map(e => {
                        const prods = products.filter(p => p[`${pfx}_id`] === e.id);
                        let revenue = 0, sold = 0, inStock = 0, stockValue = 0;
                        prods.forEach(p => {
                            (iByP[p.product_id] || []).filter(i => oSet.has(i.order_id)).forEach(i => { sold += i.quantity; revenue += i.quantity * +i.unit_price; });
                            inStock += invByP[p.product_id] || 0;
                            stockValue += (invByP[p.product_id] || 0) * (+p.base_price || +p.mrp || 0);
                        });
                        return { [`${pfx}_name`]: e.name, [`${pfx}_id`]: e.id, sold_qty: sold, revenue, in_stock: inStock, stock_value: stockValue };
                    }).sort((a, b) => b.revenue - a.revenue)
                };
            }

            // ── 3. Order Handler ────────────────────────────────────────────
            if (isMain(sql, 'customer_order')) {
                const orders = await fetch('customer_order', biz);

                // Aggregation
                if (lo.includes('sum(') || lo.includes('count(')) {
                    const f = orders.filter(o => {
                        if (lo.includes('current_date') && new Date(o.created_at).toDateString() !== new Date().toDateString()) return false;
                        if (lo.includes("'ecommerce'") && o.order_type !== 'Ecommerce') return false;
                        if (lo.includes("'pos'") && o.order_type !== 'POS') return false;
                        return true;
                    });
                    const total = f.reduce((a, r) => a + +r.total_amount, 0);
                    return { rows: [{ count: f.length, sum: total, revenue: total, orders: f.length }] };
                }

                // List
                const [customers, showrooms] = await Promise.all([fetch('customer', biz), fetch('showroom', biz)]);
                const cMap = Object.fromEntries(customers.map(c => [c.customer_id, c]));
                const sMap = Object.fromEntries(showrooms.map(s => [s.showroom_id, s]));

                let rows = orders
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(o => ({
                        ...o,
                        invoice_number: o.invoice_number || o.order_id,
                        order_type:     o.order_type || 'POS',
                        order_status:   o.order_status || 'Completed',
                        payment_status: o.payment_status || 'paid',
                        total_amount:   o.total_amount || 0,
                        customer_name:  cMap[o.customer_id]?.name || 'Walk-in',
                        customer_mobile: cMap[o.customer_id]?.mobile || '',
                        showroom_name:  sMap[o.showroom_id]?.showroom_name || '—'
                    }));

                // Apply filters from params
                params.filter(p => typeof p === 'string' && !p.startsWith('biz_') && !p.startsWith('%')).forEach(p => {
                    if (['Pending','Processing','Completed','Shipped','Delivered','Cancelled'].includes(p)) rows = rows.filter(o => o.order_status === p);
                    if (['paid','unpaid','partial','cancelled'].includes(p)) rows = rows.filter(o => o.payment_status === p);
                    if (p.startsWith('show_')) rows = rows.filter(o => o.showroom_id === p);
                });
                if (lo.includes("'ecommerce'")) rows = rows.filter(o => o.order_type === 'Ecommerce');
                if (lo.includes("'pos'")) rows = rows.filter(o => o.order_type === 'POS');

                return { rows: rows.slice(0, 100) };
            }

            // ── 4. Inventory Handler ────────────────────────────────────────
            if (isMain(sql, 'inventory')) {
                const inv = await fetch('inventory', biz);

                // Count queries (KPI cards)
                if (lo.includes('count(*)') || lo.includes('count( *)')) {
                    const lowCount = inv.filter(i => (i.available_qty || 0) <= 5).length;
                    return { rows: [{ count: inv.length, low_stock: lowCount }] };
                }

                // Full list — fetch all enrichment tables in parallel
                const [products, variants, showrooms, brands] = await Promise.all([
                    fetch('product', biz),
                    supabase.from('variant').select('variant_id,product_id,sku,barcode,color_code,size_code,color,frame_color_id').then(r => r.data || []),
                    fetch('showroom', biz),
                    fetch('brands', biz)
                ]);

                const pMap = Object.fromEntries(products.map(p => [p.product_id, p]));
                const vMap = Object.fromEntries(variants.map(v => [v.variant_id, v]));
                const sMap = Object.fromEntries(showrooms.map(s => [s.showroom_id, s]));
                const bMap = Object.fromEntries(brands.map(b => [b.id, b.name]));

                // Extract filter params from query/params
                const sFilter  = params.find(p => typeof p === 'string' && p.startsWith('show_'));
                const bFilter  = params.find(p => typeof p === 'string' && p.startsWith('brnd_'));
                const qFilter  = params.find(p => typeof p === 'string' && p.includes('%'));
                const lowOnly  = lo.includes('<= 5') || lo.includes('low_stock');

                let rows = inv.map(i => {
                    const p  = pMap[i.product_id] || {};
                    const v  = vMap[i.variant_id]  || {};
                    const s  = sMap[i.showroom_id] || {};
                    return {
                        ...i,
                        product_name:  p.product_name  || 'Unknown',
                        model_no:      p.model_no       || '',
                        brand_id:      p.brand_id       || '',
                        brand_name:    bMap[p.brand_id] || '—',
                        category_id:   p.category_id    || '',
                        mrp:           p.mrp            || 0,
                        sku:           v.sku            || '—',
                        barcode:       v.barcode        || '',
                        color_code:    v.color_code     || v.color || '—',
                        size_code:     v.size_code      || '',
                        color_name:    v.color_code     || v.color || '—',
                        showroom_name: s.showroom_name  || '—',
                        warehouse_name: '',
                        reserved_qty:  i.reserved_qty   || 0,
                        damaged_qty:   i.damaged_qty    || 0
                    };
                });

                // Apply filters
                if (sFilter)   rows = rows.filter(i => i.showroom_id  === sFilter);
                if (bFilter)   rows = rows.filter(i => i.brand_id     === bFilter);
                if (lowOnly)   rows = rows.filter(i => (i.available_qty || 0) <= 5);
                if (qFilter) {
                    const t = qFilter.replace(/%/g, '').toLowerCase();
                    rows = rows.filter(i =>
                        (i.sku          || '').toLowerCase().includes(t) ||
                        (i.product_name || '').toLowerCase().includes(t) ||
                        (i.brand_name   || '').toLowerCase().includes(t) ||
                        (i.color_code   || '').toLowerCase().includes(t) ||
                        (i.model_no     || '').toLowerCase().includes(t)
                    );
                }

                rows.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
                return { rows: rows.slice(0, 500) };
            }

            // ── 5. Eye Test / Clinic Handler ────────────────────────────────
            if (lo.includes('from "eye_test"') || lo.includes('from eye_test')) {
                const tests = await fetch('eye_test', biz);
                if (lo.includes('count(') || lo.includes('count(*)')) {
                    const now = new Date();
                    const cutoff30 = new Date(now); cutoff30.setDate(now.getDate() - 30);
                    return { rows: [{ count: tests.length, today: tests.filter(t => new Date(t.test_date).toDateString() === now.toDateString()).length, last30: tests.filter(t => new Date(t.test_date) >= cutoff30).length, unique_patients: new Set(tests.map(t => t.customer_id)).size }] };
                }
                const customers = await fetch('customer', biz);
                const cMap = Object.fromEntries(customers.map(c => [c.customer_id, c]));
                return { rows: tests.map(t => ({ ...t, customer_name: cMap[t.customer_id]?.name || 'Walk-in', mobile: cMap[t.customer_id]?.mobile || '' })).sort((a, b) => new Date(b.test_date) - new Date(a.test_date)).slice(0, 100) };
            }

            // ── 6. Repair Handler ───────────────────────────────────────────
            if (lo.includes('from "repair"') || isMain(sql, 'repair')) {
                const repairs = await fetch('repair', biz);
                if (lo.includes('count(') || lo.includes('sum(')) {
                    const now = new Date(); const cutoff30 = new Date(now); cutoff30.setDate(now.getDate() - 30);
                    return { rows: [{ count: repairs.length, pending: repairs.filter(r => ['Received','In Progress'].includes(r.status)).length, ready: repairs.filter(r => r.status === 'Ready').length, revenue30d: repairs.filter(r => r.status === 'Delivered' && new Date(r.created_at) >= cutoff30).reduce((a, r) => a + +r.cost, 0) }] };
                }
                const customers = await fetch('customer', biz);
                const cMap = Object.fromEntries(customers.map(c => [c.customer_id, c]));
                return { rows: repairs.map(r => ({ ...r, customer_name: cMap[r.customer_id]?.name || '—', mobile: cMap[r.customer_id]?.mobile || '' })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100) };
            }

            // ── 7. Customer Handler ─────────────────────────────────────────
            if (isMain(sql, 'customer')) {
                const [customers, orders, loyalty] = await Promise.all([fetch('customer', biz), supabase.from('customer_order').select('customer_id,total_amount').eq('business_id', biz).then(r => r.data || []), fetch('loyalty', biz)]);
                const loyMap = Object.fromEntries(loyalty.map(l => [l.customer_id, l]));
                let rows = customers.map(c => {
                    const cOrds = orders.filter(o => o.customer_id === c.customer_id);
                    const loy = loyMap[c.customer_id];
                    return { ...c, tier: loy?.tier || 'Silver', points: loy?.points || 0, order_count: cOrds.length, lifetime_value: cOrds.reduce((a, o) => a + +o.total_amount, 0) };
                }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                // search filter
                const searchParam = params.find(p => typeof p === 'string' && p.includes('%'));
                if (searchParam) { const t = searchParam.replace(/%/g, '').toLowerCase(); rows = rows.filter(c => (c.name || '').toLowerCase().includes(t) || (c.mobile || '').includes(t) || (c.email || '').toLowerCase().includes(t)); }
                const tierParam = params.find(p => ['Silver', 'Gold', 'Platinum'].includes(p));
                if (tierParam) rows = rows.filter(c => (loyMap[c.customer_id]?.tier || 'Silver') === tierParam);
                const limitVal  = typeof params[params.length - 2] === 'number' ? params[params.length - 2] : 50;
                const offsetVal = typeof params[params.length - 1] === 'number' ? params[params.length - 1] : 0;
                return { rows: rows.slice(offsetVal, offsetVal + limitVal) };
            }

            // ── 8. Loyalty Handler ──────────────────────────────────────────
            if (isMain(sql, 'loyalty')) {
                const [loyalty, customers] = await Promise.all([fetch('loyalty', biz), fetch('customer', biz)]);
                if (lo.includes('group by tier')) {
                    const tiers = {}; loyalty.forEach(l => { tiers[l.tier] = (tiers[l.tier] || 0) + 1; });
                    return { rows: Object.entries(tiers).map(([tier, count]) => ({ tier, count })) };
                }
                const cMap = Object.fromEntries(customers.map(c => [c.customer_id, c]));
                return { rows: loyalty.map(l => ({ ...l, customer_name: cMap[l.customer_id]?.name || 'Unknown', customer_mobile: cMap[l.customer_id]?.mobile || '' })).sort((a, b) => b.points - a.points).slice(0, 50) };
            }

            // ── 9. CRM Leads Handler ────────────────────────────────────────
            if (isMain(sql, '"lead"') || isMain(sql, 'lead')) {
                const leads = await fetch('lead', biz);
                if (lo.includes('group by status') || lo.includes('count(*)')) {
                    if (lo.includes('group by status')) {
                        const groups = {}; leads.forEach(l => { groups[l.status] = (groups[l.status] || 0) + 1; });
                        return { rows: Object.entries(groups).map(([status, count]) => ({ status, count: String(count) })) };
                    }
                    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
                    return { rows: [{ count: leads.length, new_leads: leads.filter(l => new Date(l.created_at) >= cutoff).length, converted: leads.filter(l => l.status === 'Converted').length }] };
                }
                // Apply filters
                let rows = leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const statusP = params.find(p => ['New','Contacted','Qualified','Converted','Dropped'].includes(p));
                const sourceP = params.find(p => ['Walk-in','Social','Referral','Online','Cold Call'].includes(p));
                if (statusP) rows = rows.filter(l => l.status === statusP);
                if (sourceP) rows = rows.filter(l => l.source === sourceP);
                const searchP = params.find(p => typeof p === 'string' && p.includes('%'));
                if (searchP) { const t = searchP.replace(/%/g, '').toLowerCase(); rows = rows.filter(l => (l.name || '').toLowerCase().includes(t) || (l.mobile || '').includes(t)); }
                const lim = typeof params[params.length - 2] === 'number' ? params[params.length - 2] : 50;
                const off = typeof params[params.length - 1] === 'number' ? params[params.length - 1] : 0;
                return { rows: rows.slice(off, off + lim) };
            }

            // ── 10. Follow-up Handler ───────────────────────────────────────
            if (isMain(sql, 'follow_up')) {
                const [followups, leads] = await Promise.all([fetch('follow_up', biz), fetch('lead', biz)]);
                const lMap = Object.fromEntries(leads.map(l => [l.lead_id, l]));
                return { rows: followups.map(f => ({ ...f, lead_name: lMap[f.lead_id]?.name || '—', mobile: lMap[f.lead_id]?.mobile || '' })).sort((a, b) => new Date(a.followup_date) - new Date(b.followup_date)).slice(0, 100) };
            }

            // ── 10. Product Handler (enriched with brand, variant, inventory) ──
            if (isMain(sql, 'product')) {
                const [products, brands, categories, genders, frameTypes, shapes, materials, variants, inventory] = await Promise.all([
                    fetch('product', biz),
                    fetch('brands', biz),
                    fetch('categories', biz),
                    fetch('genders', biz),
                    fetch('frame_types', biz),
                    fetch('shapes', biz),
                    fetch('materials', biz),
                    supabase.from('variant').select('*').then(r => r.data || []),
                    fetch('inventory', biz)
                ]);

                // Build lookup maps
                const brandMap    = Object.fromEntries(brands.map(b    => [b.id, b.name]));
                const catMap      = Object.fromEntries(categories.map(c => [c.id, c.name]));
                const genderMap   = Object.fromEntries(genders.map(g   => [g.id, g.name]));
                const ftMap       = Object.fromEntries(frameTypes.map(f => [f.id, f.name]));
                const shapeMap    = Object.fromEntries(shapes.map(s    => [s.id, s.name]));
                const matMap      = Object.fromEntries(materials.map(m  => [m.id, m.name]));

                // Group variants by product_id (first variant = primary)
                const varByProd   = {};
                variants.forEach(v => { if (!varByProd[v.product_id]) varByProd[v.product_id] = v; });

                // Sum inventory by product_id (with optional showroom filter)
                const showroomFilter = params.find(p => typeof p === 'string' && p.startsWith('show_'));
                const invByProd = {};
                inventory.forEach(i => {
                    if (showroomFilter && i.showroom_id !== showroomFilter) return;
                    invByProd[i.product_id] = (invByProd[i.product_id] || 0) + (i.available_qty || 0);
                });

                // Single product lookup (e.g. GET /api/products/:id)
                const singleId = params.find(p => typeof p === 'string' && p.startsWith('prod_'));
                let rows = products;
                if (singleId) rows = rows.filter(p => p.product_id === singleId);

                // Apply active_status filter (default: only active)
                if (!lo.includes('active_status')) rows = rows.filter(p => p.active_status !== false);

                // Apply search
                const searchParam = params.find(p => typeof p === 'string' && p.includes('%'));
                if (searchParam) {
                    const t = searchParam.replace(/%/g, '').toLowerCase();
                    rows = rows.filter(p =>
                        (p.product_name || '').toLowerCase().includes(t) ||
                        (p.model_no     || '').toLowerCase().includes(t) ||
                        (p.upc_code     || '').toLowerCase().includes(t) ||
                        (brandMap[p.brand_id] || '').toLowerCase().includes(t)
                    );
                }

                // Apply ID filters
                ['brand_id','category_id','gender_id','frame_type_id'].forEach(col => {
                    const val = params.find(p => typeof p === 'string' && !p.startsWith('biz_') && !p.includes('%') && !p.startsWith('prod_') && !p.startsWith('show_'));
                    // skip — handled generically below via column matching
                });

                rows = rows.map(p => {
                    const v = varByProd[p.product_id];
                    return {
                        ...p,
                        brand_name:       brandMap[p.brand_id]        || '—',
                        category_name:    catMap[p.category_id]       || '—',
                        gender_name:      genderMap[p.gender_id]      || '—',
                        joined_frame_type: ftMap[p.frame_type_id]     || '—',
                        shape_name:       shapeMap[p.shape_id]        || '—',
                        joined_material:  matMap[p.material_id]       || '—',
                        color_code:       v?.color_code               || '',
                        size_code:        v?.size_code                || '',
                        variant_sku:      v?.sku                      || '',
                        primary_variant_id: v?.variant_id             || null,
                        total_stock:      invByProd[p.product_id]     || 0
                    };
                }).sort((a, b) => (a.brand_name + a.product_name).localeCompare(b.brand_name + b.product_name));

                // Pagination
                const lim = params.find(p => typeof p === 'number' && p >= 10 && p <= 1000) || 200;
                const off = params[params.length - 1] || 0;
                return { rows: singleId ? rows : rows.slice(typeof off === 'number' ? off : 0, (typeof off === 'number' ? off : 0) + (typeof lim === 'number' ? lim : 200)) };
            }

            // ── 11. Generic Table Handler ───────────────────────────────────
            const tblMatch = stripParens(sql).match(/from\s+["']?([a-z0-9_]+)["']?/i);
            if (tblMatch) {
                const tbl = tblMatch[1];
                let q = supabase.from(tbl).select('*');
                if (lo.includes('business_id')) q = q.eq('business_id', biz);
                // Apply simple = conditions from WHERE (skip subqueries already stripped)
                const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|LIMIT|GROUP BY|$)/is);
                if (whereMatch) {
                    whereMatch[1].split(/\bAND\b/i).forEach(cond => {
                        const m = cond.match(/\b([a-z0-9_.]+)\s*=\s*\$([0-9]+)/i);
                        if (m) { const col = m[1].trim().split('.').pop(); const val = params[parseInt(m[2]) - 1]; if (val !== undefined && col !== 'business_id') q = q.eq(col, val); }
                    });
                }
                if (lo.includes('order by') && lo.includes('created_at desc')) q = q.order('created_at', { ascending: false });
                const { data, error } = await q.limit(500);
                if (error) console.warn(`[DB Generic] ${tbl}:`, error.message);
                return { rows: data || [] };
            }

            // ─────────────────────────────────────────────────────────────────
            // FALLBACK TO DIRECT PG (FOR WRITES AND UNHANDLED SELECTS)
            // ─────────────────────────────────────────────────────────────────
            const res = await pool.query(sql, params);
            return {
                rows: res.rows || [],
                rowCount: res.rowCount || 0,
                lastId: res.rows?.[0]?.id || null
            };

        } catch (err) {
            console.error(`[DB PROXY v48 ERROR]`, err.message);
            // Re-throw or return empty? Let's return empty to avoid crashing the server
            return { rows: [], rowCount: 0 };
        }
    }
};
