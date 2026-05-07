// routes/reports.routes.js — Analytics & GST Reports (Supabase direct for dashboard endpoints)
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db'); // kept for GST/financial endpoints that haven't been migrated yet
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// JS-side groupBy aggregation helper
function groupBy(arr, keyFn) {
    const m = {};
    for (const item of arr) {
        const k = keyFn(item);
        if (!m[k]) m[k] = [];
        m[k].push(item);
    }
    return m;
}

// GET /api/reports/dashboard — Main KPI dashboard
router.get('/dashboard', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    const period      = req.query.period || 'Today';
    const showroom_id = req.query.showroom_id || '';
    const supabase    = getSupabase();
    try {
        // Date boundaries (JS-side)
        const now   = new Date();
        const today = now.toISOString().slice(0, 10);
        const periodStart = (() => {
            if (period === 'Today') return today;
            if (period === '7D')   { const d = new Date(now); d.setDate(d.getDate() - 7);  return d.toISOString().slice(0,10); }
            if (period === '30D')  { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); }
            if (period === 'Year') { return `${now.getFullYear()}-01-01`; }
            return today;
        })();

        // Fetch orders and inventory in parallel
        let ordersQ = supabase.from('customer_order').select('order_id,total_amount,tax_amount,discount_amount,order_status,payment_status,created_at,showroom_id').eq('business_id', business_id).gte('created_at', periodStart + 'T00:00:00');
        if (showroom_id) ordersQ = ordersQ.eq('showroom_id', showroom_id);

        let invQ = supabase.from('inventory').select('available_qty').eq('business_id', business_id);
        if (showroom_id) invQ = invQ.eq('showroom_id', showroom_id);

        const [{ data: orders }, { data: inventory }] = await Promise.all([ordersQ, invQ]);

        const active = (orders || []).filter(o => o.payment_status !== 'cancelled');
        const period_revenue = active.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
        const period_orders  = active.length;
        const pending_orders = (orders || []).filter(o => o.order_status === 'Processing').length;
        const low_stock_alerts = (inventory || []).filter(i => parseInt(i.available_qty || 0) <= 5).length;

        // Total stock units and value
        let invWithValQ = supabase.from('inventory').select('available_qty,product_id').eq('business_id', business_id);
        if (showroom_id) invWithValQ = invWithValQ.eq('showroom_id', showroom_id);
        let prodValQ = supabase.from('product').select('product_id,mrp,selling_price').eq('business_id', business_id);
        const [{ data: invFull }, { data: prodsFull }] = await Promise.all([invWithValQ, prodValQ]);
        const prodMrpMap = Object.fromEntries((prodsFull || []).map(p => [p.product_id, parseFloat(p.selling_price || p.mrp || 0)]));
        const total_stock_units = (invFull || []).reduce((s, i) => s + parseInt(i.available_qty || 0), 0);
        const total_stock_value = (invFull || []).reduce((s, i) => s + parseInt(i.available_qty || 0) * (prodMrpMap[i.product_id] || 0), 0);


        // Month revenue (for Growth Overview card — always full month regardless of period)
        const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
        let monthQ = supabase.from('customer_order').select('total_amount,payment_status').eq('business_id', business_id).gte('created_at', monthStart + 'T00:00:00');
        if (showroom_id) monthQ = monthQ.eq('showroom_id', showroom_id);
        const { data: monthOrders } = await monthQ;
        const month_active  = (monthOrders || []).filter(o => o.payment_status !== 'cancelled');
        const month_revenue = month_active.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
        const month_orders  = month_active.length;

        res.json({
            success: true,
            data: {
                today_revenue:    period_revenue,
                today_orders:     period_orders,
                period_revenue,
                period_orders,
                month_revenue,
                month_orders,
                pending_orders,
                low_stock_alerts,
                total_stock_units,
                total_stock_value
            }
        });
    } catch (err) {
        console.error('[dashboard error]', err.message);
        res.status(500).json({ success: false, error: 'Dashboard fetch failed' });
    }
});

// GET /api/reports/dashboard-rich — Detailed breakdown widgets
router.get('/dashboard-rich', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    const { category_id, gender_id, showroom_id } = req.query;
    const supabase = getSupabase();

    try {
        // Fetch all base data in parallel
        const [
            { data: brands },     { data: categories },
            { data: genders },    { data: showrooms },
            { data: products },   { data: inventory },
            { data: orderItems }, { data: orders }
        ] = await Promise.all([
            supabase.from('brands').select('id,name').eq('business_id', business_id),
            supabase.from('categories').select('id,name').eq('business_id', business_id),
            supabase.from('genders').select('id,name').eq('business_id', business_id),
            supabase.from('showroom').select('showroom_id,showroom_name').eq('business_id', business_id),
            supabase.from('product').select('product_id,brand_id,category_id,gender_id,product_name,main_image,model_no,mrp').eq('business_id', business_id).eq('active_status', true),
            supabase.from('inventory').select('variant_id,product_id,showroom_id,available_qty,business_id').eq('business_id', business_id),
            supabase.from('order_item').select('item_id,order_id,product_id,quantity,unit_price'),
            supabase.from('customer_order').select('order_id,showroom_id,order_type,payment_status,total_amount,created_at').eq('business_id', business_id)
        ]);

        // Build lookup maps
        const prodMap   = Object.fromEntries((products || []).map(p => [p.product_id, p]));
        const orderMap  = Object.fromEntries((orders   || []).map(o => [o.order_id, o]));

        // Filter order_items to only active (non-cancelled) orders
        const activeOrderIds = new Set((orders || []).filter(o => o.payment_status !== 'cancelled').map(o => o.order_id));
        const activeItems    = (orderItems || []).filter(i => activeOrderIds.has(i.order_id));

        // Apply category/gender/showroom filters to products
        const filteredProds = (products || []).filter(p => {
            if (category_id && p.category_id !== category_id) return false;
            if (gender_id   && p.gender_id   !== gender_id)   return false;
            return true;
        });
        const filteredProdIds = new Set(filteredProds.map(p => p.product_id));

        // Filter inventory by showroom if selected
        const filteredInv = (inventory || []).filter(i => {
            if (showroom_id && i.showroom_id !== showroom_id) return false;
            return filteredProdIds.has(i.product_id);
        });

        // Filter order items to filtered products
        const filteredItems = activeItems.filter(i => filteredProdIds.has(i.product_id));

        // Helper: aggregate per-id
        const agg = (items, getId, inv) => {
            const soldMap = {}, revMap = {};
            items.forEach(i => {
                const id = getId(prodMap[i.product_id]);
                if (!id) return;
                soldMap[id] = (soldMap[id] || 0) + parseInt(i.quantity || 0);
                revMap[id]  = (revMap[id]  || 0) + parseFloat(i.unit_price || 0) * parseInt(i.quantity || 0);
            });
            const stockMap = {};
            (inv || []).forEach(i => {
                const id = getId(prodMap[i.product_id]);
                if (!id) return;
                stockMap[id] = (stockMap[id] || 0) + parseInt(i.available_qty || 0);
            });
            return { soldMap, revMap, stockMap };
        };

        // Brand stats
        const bAgg = agg(filteredItems, p => p?.brand_id, filteredInv);
        const brandStats = (brands || []).map(b => {
            const in_stock = bAgg.stockMap[b.id] || 0;
            const stock_value = (filteredInv || []).filter(i => prodMap[i.product_id]?.brand_id === b.id)
                .reduce((s, i) => s + parseInt(i.available_qty||0) * parseFloat(prodMap[i.product_id]?.mrp||0), 0);
            return { brand_name: b.name, sold_qty: bAgg.soldMap[b.id]||0, revenue: bAgg.revMap[b.id]||0, in_stock, stock_value };
        }).sort((a,b) => b.revenue - a.revenue);

        // Category stats
        const cAgg = agg(filteredItems, p => p?.category_id, filteredInv);
        const catStats = (categories || []).map(c => {
            const in_stock = cAgg.stockMap[c.id] || 0;
            const stock_value = (filteredInv || []).filter(i => prodMap[i.product_id]?.category_id === c.id)
                .reduce((s, i) => s + parseInt(i.available_qty||0) * parseFloat(prodMap[i.product_id]?.mrp||0), 0);
            return { category_name: c.name, category_id: c.id, sold_qty: cAgg.soldMap[c.id]||0, revenue: cAgg.revMap[c.id]||0, in_stock, stock_value };
        }).sort((a,b) => b.revenue - a.revenue);

        // Gender stats
        const gAgg = agg(filteredItems, p => p?.gender_id, filteredInv);
        const genderStats = (genders || []).map(g => {
            const in_stock = gAgg.stockMap[g.id] || 0;
            const stock_value = (filteredInv || []).filter(i => prodMap[i.product_id]?.gender_id === g.id)
                .reduce((s, i) => s + parseInt(i.available_qty||0) * parseFloat(prodMap[i.product_id]?.mrp||0), 0);
            return { gender_name: g.name, gender_id: g.id, sold_qty: gAgg.soldMap[g.id]||0, revenue: gAgg.revMap[g.id]||0, in_stock, stock_value };
        }).sort((a,b) => b.revenue - a.revenue);

        // Showroom stats — filter orders by showroom
        const showroomStats = (showrooms || []).map(s => {
            const sOrders   = (orders || []).filter(o => o.showroom_id === s.showroom_id && o.payment_status !== 'cancelled');
            const sOrderIds = new Set(sOrders.map(o => o.order_id));
            const sItems    = activeItems.filter(i => sOrderIds.has(i.order_id));
            const sInv      = (inventory || []).filter(i => i.showroom_id === s.showroom_id);
            const revenue   = sItems.reduce((sum, i) => sum + parseFloat(i.unit_price||0) * parseInt(i.quantity||0), 0);
            const in_stock  = sInv.reduce((sum, i) => sum + parseInt(i.available_qty||0), 0);
            const stock_value = sInv.reduce((sum, i) => sum + parseInt(i.available_qty||0) * parseFloat(prodMap[i.product_id]?.mrp||0), 0);
            return { showroom_name: s.showroom_name, orders: sOrders.length, revenue, in_stock, stock_value };
        }).sort((a,b) => b.revenue - a.revenue);

        // Ecommerce summary
        const ecomOrders = (orders || []).filter(o => o.order_type === 'Ecommerce' && o.payment_status !== 'cancelled');
        const ecomItems  = activeItems.filter(i => {
            const o = orderMap[i.order_id];
            return o && o.order_type === 'Ecommerce' && filteredProdIds.has(i.product_id);
        });
        const ecommerce = {
            orders:  ecomOrders.length,
            revenue: ecomItems.reduce((s,i) => s + parseFloat(i.unit_price||0)*parseInt(i.quantity||0), 0)
        };

        // Ecommerce trend — last 6 months, group by month
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const ecomTrendOrders = ecomOrders.filter(o => new Date(o.created_at) >= sixMonthsAgo);
        const trendByMonth = {};
        ecomTrendOrders.forEach(o => {
            const d = new Date(o.created_at);
            const key = d.toLocaleString('en-US', { month: 'short' });
            trendByMonth[key] = (trendByMonth[key] || 0) + parseFloat(o.total_amount || 0);
        });
        const ecommerce_trend = Object.entries(trendByMonth).map(([month, revenue]) => ({ month, revenue }));

        // Frequent POS products
        const posOrderIds = new Set((orders||[]).filter(o => o.order_type==='POS' && o.payment_status!=='cancelled').map(o=>o.order_id));
        const posItems    = (orderItems||[]).filter(i => posOrderIds.has(i.order_id));
        const posQtyMap   = {};
        posItems.forEach(i => { posQtyMap[i.product_id] = (posQtyMap[i.product_id]||0) + parseInt(i.quantity||0); });
        const frequent_pos = Object.entries(posQtyMap)
            .sort((a,b) => b[1]-a[1]).slice(0,10)
            .map(([pid, repeat_count]) => ({ ...prodMap[pid], repeat_count })).filter(p=>p.product_id);

        // Frequent Ecom products
        const ecomItemsFull = (orderItems||[]).filter(i => posOrderIds.has(i.order_id) === false && activeOrderIds.has(i.order_id));
        const ecomQtyMap    = {};
        ecomItemsFull.forEach(i => { ecomQtyMap[i.product_id] = (ecomQtyMap[i.product_id]||0) + parseInt(i.quantity||0); });
        const frequent_ecom = Object.entries(ecomQtyMap)
            .sort((a,b) => b[1]-a[1]).slice(0,10)
            .map(([pid, repeat_count]) => ({ ...prodMap[pid], repeat_count })).filter(p=>p.product_id);

        res.json({
            success: true,
            data: { brands: brandStats, genders: genderStats, categories: catStats, showrooms: showroomStats, ecommerce, ecommerce_trend, frequent_pos, frequent_ecom, showroom_id: showroom_id || '' }
        });
    } catch (err) {
        console.error('[Dashboard-Rich ERROR]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// GET /api/reports/sales — Sales summary with date range
router.get('/sales', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id, from_date, to_date, showroom_id } = req.query;
    const conditions = ['business_id = $1'];
    const values = [business_id || req.user.business_id];
    let i = 2;
    if (from_date)   { conditions.push(`DATE(created_at) >= $${i++}`); values.push(from_date); }
    if (to_date)     { conditions.push(`DATE(created_at) <= $${i++}`); values.push(to_date); }
    if (showroom_id) { conditions.push(`showroom_id = $${i++}`); values.push(showroom_id); }

    try {
        const { rows } = await db.query(
            `SELECT DATE(created_at) AS date,
                    COUNT(*) AS orders,
                    SUM(total_amount) AS revenue,
                    SUM(tax_amount) AS gst_collected,
                    SUM(discount_amount) AS discounts_given,
                    AVG(total_amount) AS avg_order_value
             FROM customer_order
             WHERE ${conditions.join(' AND ')} AND payment_status != 'cancelled'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            values
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Sales report failed' });
    }
});

// GET /api/reports/analytics — Visual report data with Advanced Filters
router.get('/analytics', auth, async (req, res) => {
    const { showroom_id, period, from_date, to_date } = req.query;
    const business_id = req.user.business_id;
    const supabase = getSupabase();

    // Determine date window
    const now = new Date();
    let startDate = new Date(now); startDate.setDate(startDate.getDate() - 30);
    if (period === 'today') { startDate = new Date(now); startDate.setHours(0,0,0,0); }
    else if (period === '7d')   { startDate = new Date(now); startDate.setDate(now.getDate()-7); }
    else if (period === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (period === 'year')  { startDate = new Date(now.getFullYear(), 0, 1); }
    else if (from_date)          { startDate = new Date(from_date); }
    const endDate = to_date ? new Date(to_date + 'T23:59:59') : now;

    try {
        // Parallel fetch
        let ordQ = supabase.from('customer_order').select('order_id,showroom_id,order_type,order_status,payment_status,total_amount,tax_amount,discount_amount,created_at').eq('business_id', business_id).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
        if (showroom_id && showroom_id !== 'all') ordQ = ordQ.eq('showroom_id', showroom_id);

        const [{ data: orders }, { data: orderItems }, { data: products }, { data: brands }, { data: categories }, { data: showrooms }, { data: customers }, { data: inventory }] = await Promise.all([
            ordQ,
            supabase.from('order_item').select('order_id,product_id,quantity,unit_price'),
            supabase.from('product').select('product_id,product_name,brand_id,category_id').eq('business_id', business_id),
            supabase.from('brands').select('id,name').eq('business_id', business_id),
            supabase.from('categories').select('id,name').eq('business_id', business_id),
            supabase.from('showroom').select('showroom_id,showroom_name').eq('business_id', business_id),
            supabase.from('customer').select('customer_id,name,mobile').eq('business_id', business_id),
            supabase.from('inventory').select('product_id,available_qty,business_id').eq('business_id', business_id)
        ]);

        const activeOrderIds = new Set((orders||[]).filter(o => o.payment_status !== 'cancelled').map(o => o.order_id));
        const activeItems    = (orderItems||[]).filter(i => activeOrderIds.has(i.order_id));
        const prodMap  = Object.fromEntries((products||[]).map(p=>[p.product_id, p]));
        const brandMap = Object.fromEntries((brands||[]).map(b=>[b.id, b.name]));
        const catMap   = Object.fromEntries((categories||[]).map(c=>[c.id, c.name]));
        const showMap  = Object.fromEntries((showrooms||[]).map(s=>[s.showroom_id, s.showroom_name]));
        const custMap  = Object.fromEntries((customers||[]).map(c=>[c.customer_id, c]));

        // Category performance
        const catRevMap = {};
        activeItems.forEach(i => { const cid = prodMap[i.product_id]?.category_id; if (cid) catRevMap[cid] = (catRevMap[cid]||0) + parseFloat(i.unit_price||0)*parseInt(i.quantity||0); });
        const catStats = Object.entries(catRevMap).map(([id,revenue]) => ({ category_name: catMap[id]||id, revenue })).sort((a,b)=>b.revenue-a.revenue);

        // Brand performance
        const brandRevMap = {};
        activeItems.forEach(i => { const bid = prodMap[i.product_id]?.brand_id; if (bid) brandRevMap[bid] = (brandRevMap[bid]||0) + parseFloat(i.unit_price||0)*parseInt(i.quantity||0); });
        const brandStats = Object.entries(brandRevMap).map(([id,revenue]) => ({ brand_name: brandMap[id]||id, revenue })).sort((a,b)=>b.revenue-a.revenue);

        // Showroom performance
        const showRevMap = {}, showOrdMap = {};
        (orders||[]).filter(o=>o.payment_status!=='cancelled').forEach(o => {
            const sid = o.showroom_id; if (!sid) return;
            showRevMap[sid] = (showRevMap[sid]||0) + parseFloat(o.total_amount||0);
            showOrdMap[sid] = (showOrdMap[sid]||0) + 1;
        });
        const showroomStats = Object.entries(showRevMap).map(([id,revenue]) => ({ showroom_name: showMap[id]||id, revenue, orders: showOrdMap[id]||0 })).sort((a,b)=>b.revenue-a.revenue);

        // Daily trends
        const dayMap = {};
        (orders||[]).filter(o=>o.payment_status!=='cancelled').forEach(o => {
            const d = o.created_at?.slice(0,10); if (!d) return;
            dayMap[d] = (dayMap[d]||0) + parseFloat(o.total_amount||0);
        });
        const trends = Object.entries(dayMap).sort((a,b)=>a[0]>b[0]?1:-1).map(([date,revenue])=>({date,revenue}));

        // Top products
        const prodQtyMap = {}, prodRevMap = {};
        activeItems.forEach(i => {
            prodQtyMap[i.product_id] = (prodQtyMap[i.product_id]||0) + parseInt(i.quantity||0);
            prodRevMap[i.product_id] = (prodRevMap[i.product_id]||0) + parseFloat(i.unit_price||0)*parseInt(i.quantity||0);
        });
        const top_products = Object.entries(prodQtyMap).sort((a,b)=>b[1]-a[1]).slice(0,20)
            .map(([pid,sold_qty]) => ({ product_name: prodMap[pid]?.product_name||pid, sold_qty, total_rev: prodRevMap[pid]||0 }));

        // Top customers
        const custRevMap = {}, custOrdMap = {};
        (orders||[]).filter(o=>o.payment_status!=='cancelled'&&o.customer_id).forEach(o => {
            custRevMap[o.customer_id] = (custRevMap[o.customer_id]||0) + parseFloat(o.total_amount||0);
            custOrdMap[o.customer_id] = (custOrdMap[o.customer_id]||0) + 1;
        });
        const top_customers = Object.entries(custRevMap).sort((a,b)=>b[1]-a[1]).slice(0,10)
            .map(([cid,total_spent]) => ({ name: custMap[cid]?.name||'Unknown', mobile: custMap[cid]?.mobile||'', order_count: custOrdMap[cid]||0, total_spent }));

        // Pipeline stats
        const activeOrds = (orders||[]).filter(o=>o.payment_status!=='cancelled');
        const pipeline = {
            total_revenue:    activeOrds.reduce((s,o)=>s+parseFloat(o.total_amount||0),0),
            total_orders:     activeOrds.length,
            pending:          activeOrds.filter(o=>o.order_status==='Pending').length,
            delivered:        activeOrds.filter(o=>o.order_status==='Delivered').length,
            ecommerce_count:  activeOrds.filter(o=>o.order_type==='Ecommerce').length,
            pos_count:        activeOrds.filter(o=>o.order_type==='POS').length
        };

        // Stock valuation
        const stock_value = (inventory||[]).reduce((s,i) => {
            const p = prodMap[i.product_id]; if (!p) return s;
            return s + parseInt(i.available_qty||0) * parseFloat(p.mrp||0);
        }, 0);

        res.json({ success: true, data: { categories: catStats, brands: brandStats, showrooms: showroomStats, trends, top_products, top_customers, pipeline, stock_value } });
    } catch (err) {
        console.error('[analytics error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reports/gst/r1 — GSTR-1 Sales Report (Detailed)
router.get('/gst/r1', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { from_date, to_date, showroom_id } = req.query;
    const business_id = req.user.business_id;

    const filter = [`co.business_id = $1`, `co.payment_status != 'cancelled'`];
    const vals = [business_id];
    if (from_date) { filter.push(`DATE(co.created_at) >= $${vals.length + 1}`); vals.push(from_date); }
    if (to_date)   { filter.push(`DATE(co.created_at) <= $${vals.length + 1}`); vals.push(to_date); }
    if (showroom_id && showroom_id !== 'all') { filter.push(`co.showroom_id = $${vals.length + 1}`); vals.push(showroom_id); }

    try {
        const query = `
            SELECT 
                co.order_id, co.created_at as date, co.order_type,
                c.name as customer_name, c.mobile as customer_mobile,
                p.product_name, p.category_id,
                oi.qty, oi.price_at_order as taxable_value,
                it.tax_percentage as rate,
                it.cgst_amount, it.sgst_amount, it.igst_amount, it.tax_amount as total_tax,
                (oi.qty * oi.price_at_order + it.tax_amount) as invoice_value
            FROM customer_order co
            JOIN customer c ON co.customer_id = c.customer_id
            JOIN customer_order_item oi ON co.order_id = oi.order_id
            JOIN product p ON oi.product_id = p.product_id
            LEFT JOIN order_item_tax it ON oi.order_id = it.order_id AND oi.product_id = it.product_id
            WHERE ${filter.join(' AND ')}
            ORDER BY co.created_at DESC`;
        
        const { rows } = await db.query(query, vals);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/reports/gst/hsn — HSN Summary
router.get('/gst/hsn', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { from_date, to_date } = req.query;
    const business_id = req.user.business_id;
    const vals = [business_id, from_date || '2000-01-01', to_date || '2100-01-01'];

    try {
        const query = `
            SELECT 
                p.category_id as hsn_desc, -- Using category as proxy for HSN if HSN column is missing
                SUM(oi.qty) as total_qty,
                SUM(oi.qty * oi.price_at_order) as total_taxable_value,
                SUM(it.tax_amount) as total_tax,
                SUM(it.cgst_amount) as total_cgst,
                SUM(it.sgst_amount) as total_sgst,
                SUM(it.igst_amount) as total_igst
            FROM customer_order_item oi
            JOIN product p ON oi.product_id = p.product_id
            JOIN customer_order co ON oi.order_id = co.order_id
            LEFT JOIN order_item_tax it ON oi.order_id = it.order_id AND oi.product_id = it.product_id
            WHERE co.business_id = $1 AND DATE(co.created_at) BETWEEN $2 AND $3 AND co.payment_status != 'cancelled'
            GROUP BY p.category_id`;
        
        const { rows } = await db.query(query, vals);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/reports/gst/summary — Tax-tier Summary
router.get('/gst/summary', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { from_date, to_date } = req.query;
    const business_id = req.user.business_id;
    const vals = [business_id, from_date || '2000-01-01', to_date || '2100-01-01'];

    try {
        const query = `
            SELECT 
                it.tax_percentage as gst_rate,
                SUM(oi.qty * oi.price_at_order) as total_taxable,
                SUM(it.cgst_amount) as cgst,
                SUM(it.sgst_amount) as sgst,
                SUM(it.igst_amount) as igst,
                SUM(it.tax_amount) as total_gst
            FROM order_item_tax it
            JOIN customer_order co ON it.order_id = co.order_id
            JOIN customer_order_item oi ON it.order_id = oi.order_id AND it.product_id = oi.product_id
            WHERE co.business_id = $1 AND DATE(co.created_at) BETWEEN $2 AND $3 AND co.payment_status != 'cancelled'
            GROUP BY it.tax_percentage
            ORDER BY it.tax_percentage ASC`;
        
        const { rows } = await db.query(query, vals);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/reports/financial-dashboard — Consolidated Finance View
router.get('/financial-dashboard', auth, async (req, res) => {
    const business_id = req.user.business_id;
    const { from_date, to_date, showroom_id } = req.query;

    const start = from_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = to_date || new Date().toISOString().split('T')[0];
    
    const filters = [`co.business_id = $1`, `DATE(co.created_at) >= $2::DATE`, `DATE(co.created_at) <= $3::DATE` ];
    const params = [business_id, start, end];

    if (showroom_id && showroom_id !== 'all') {
        filters.push(`co.showroom_id = $${params.length + 1}`);
        params.push(showroom_id);
    }
    const where = filters.join(' AND ');

    try {
        const [kpis, trends, expBreakdown, showroomPerform] = await Promise.all([
            db.query(`
                SELECT 
                    COALESCE(SUM(total_amount),0) as revenue,
                    COUNT(*) as total_orders,
                    COALESCE(AVG(total_amount),0) as aov,
                    COALESCE(SUM(tax_amount),0) as total_gst,
                    (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE business_id = $1 AND date >= $2::DATE AND date <= $3::DATE) as total_expense
                FROM customer_order co
                WHERE ${where} AND co.payment_status != 'cancelled'
            `, params),

            db.query(`
                SELECT DATE(co.created_at) as date, SUM(co.total_amount) as revenue
                FROM customer_order co
                WHERE ${where} AND co.payment_status != 'cancelled'
                GROUP BY DATE(co.created_at) ORDER BY date ASC
            `, params),

            db.query(`
                SELECT a.account_name as category, SUM(e.amount) as amount
                FROM expenses e
                JOIN accounts a ON e.account_id = a.account_id
                WHERE e.business_id = $1 AND e.date >= $2::DATE AND e.date <= $3::DATE
                GROUP BY a.account_name ORDER BY amount DESC
            `, [business_id, start, end]),

            db.query(`
                SELECT s.showroom_name, COALESCE(SUM(co.total_amount),0) as revenue, COUNT(co.order_id) as orders
                FROM showroom s
                LEFT JOIN customer_order co ON s.showroom_id = co.showroom_id 
                   AND co.business_id = $1 AND DATE(co.created_at) >= $2::DATE AND DATE(co.created_at) <= $3::DATE AND co.payment_status != 'cancelled'
                WHERE s.business_id = $1
                GROUP BY s.showroom_id, s.showroom_name ORDER BY revenue DESC
            `, [business_id, start, end])
        ]);

        const rev = parseFloat(kpis.rows[0].revenue);
        const exp = parseFloat(kpis.rows[0].total_expense);

        res.json({
            success: true,
            data: {
                summary: {
                    revenue: rev,
                    expense: exp,
                    profit: rev - exp,
                    aov: parseFloat(kpis.rows[0].aov || 0),
                    total_orders: parseInt(kpis.rows[0].total_orders),
                    gst: parseFloat(kpis.rows[0].total_gst)
                },
                trends: trends.rows,
                expenses: expBreakdown.rows,
                showrooms: showroomPerform.rows
            }
        });
    } catch (err) { 
        console.error('[Financial Report Error]', err);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// GET /api/reports/inventory — Inventory health & stock valuation
router.get('/inventory', auth, async (req, res) => {
    const business_id = req.user.business_id;
    const { showroom_id } = req.query;

    const values = [business_id];
    let where = 'i.business_id = $1';
    if (showroom_id && showroom_id !== 'all') {
        where += ' AND i.showroom_id = $2';
        values.push(showroom_id);
    }

    try {
        const [lowStock, summ, distribution] = await Promise.all([
            db.query(`
                SELECT p.product_name, s.showroom_name, i.available_qty
                FROM inventory i
                JOIN product p ON i.product_id = p.product_id
                JOIN showroom s ON i.showroom_id = s.showroom_id
                WHERE ${where} AND i.available_qty <= 5
                ORDER BY i.available_qty ASC LIMIT 50
            `, values),
            db.query(`
                SELECT COUNT(*) as total_skus, SUM(available_qty) as total_qty
                FROM inventory i
                WHERE ${where}
            `, values),
            db.query(`
                SELECT s.showroom_name, COUNT(i.product_id) as skus, SUM(i.available_qty) as qty
                FROM showroom s
                LEFT JOIN inventory i ON s.showroom_id = i.showroom_id AND s.business_id = i.business_id
                WHERE s.business_id = $1
                GROUP BY s.showroom_id, s.showroom_name
            `, [business_id])
        ]);

        res.json({
            success: true,
            data: {
                low_stock: lowStock.rows,
                summary: summ.rows[0],
                distribution: distribution.rows
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/reports/customers — Customer acquisition & LTV
router.get('/customers', auth, async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const [stats, top] = await Promise.all([
            db.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_30d,
                    (SELECT COUNT(DISTINCT customer_id) FROM customer_order WHERE business_id = $1) as transacting
                FROM customer WHERE business_id = $1
            `, [business_id]),
            db.query(`
                SELECT c.name, c.mobile, COUNT(co.order_id) as orders, SUM(co.total_amount) as ltv
                FROM customer c
                JOIN customer_order co ON c.customer_id = co.customer_id
                WHERE c.business_id = $1 AND co.payment_status != 'cancelled'
                GROUP BY c.customer_id, c.name, c.mobile
                ORDER BY ltv DESC LIMIT 20
            `, [business_id])
        ]);

        res.json({
            success: true,
            data: {
                status: stats.rows[0],
                top_customers: top.rows
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/reports/purchase — Procurement & Supplier Analytics
router.get('/purchase', auth, async (req, res) => {
    const business_id = req.user.business_id;
    const { from_date, to_date } = req.query;
    const start = from_date || '2000-01-01';
    const end = to_date || '2100-01-01';

    try {
        const [summ, suppliers] = await Promise.all([
            db.query(`
                SELECT 
                    COUNT(*) as total_pos,
                    SUM(total_amount) as total_spend,
                    COUNT(*) FILTER (WHERE status = 'Pending') as pending_delivery
                FROM purchase_order 
                WHERE business_id = $1 AND DATE(order_date) BETWEEN $2 AND $3
            `, [business_id, start, end]),
            db.query(`
                SELECT s.name as supplier_name, SUM(po.total_amount) as spend, COUNT(po.id) as po_count
                FROM suppliers s
                JOIN purchase_order po ON s.id = po.supplier_id
                WHERE s.business_id = $1 AND DATE(po.order_date) BETWEEN $2 AND $3
                GROUP BY s.id, s.name ORDER BY spend DESC
            `, [business_id, start, end])
        ]);

        res.json({
            success: true,
            data: {
                summary: summ.rows[0],
                top_suppliers: suppliers.rows
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
