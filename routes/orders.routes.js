// routes/orders.routes.js — POS + Ecommerce Order Management (Supabase direct)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// GET /api/orders — list orders for a business
router.get('/', auth, async (req, res) => {
    const { order_type, order_status, payment_status, showroom_id, from_date, to_date, limit = 50, offset = 0 } = req.query;
    const biz = req.query.business_id || req.user.business_id;
    const supabase = getSupabase();
    try {
        // Fetch orders
        const { data: orders, error } = await supabase
            .from('customer_order').select('*')
            .eq('business_id', biz)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        // Enrich with customer names
        const custIds = [...new Set((orders||[]).map(o => o.customer_id).filter(Boolean))];
        let custMap = {};
        if (custIds.length) {
            const { data: custs } = await supabase.from('customer').select('customer_id,name,mobile').in('customer_id', custIds);
            custMap = Object.fromEntries((custs||[]).map(c => [c.customer_id, c]));
        }
        const { data: showrooms } = await supabase.from('showroom').select('showroom_id,showroom_name').eq('business_id', biz);
        const showroomMap = Object.fromEntries((showrooms||[]).map(s => [s.showroom_id, s.showroom_name]));

        let rows = (orders||[]).map(o => ({
            ...o,
            customer_name:  custMap[o.customer_id]?.name   || 'Walk-in',
            customer_mobile: custMap[o.customer_id]?.mobile || '',
            showroom_name:  showroomMap[o.showroom_id]     || ''
        }));

        // JS-side filters
        if (order_type)     rows = rows.filter(o => o.order_type     === order_type);
        if (order_status)   rows = rows.filter(o => o.order_status   === order_status);
        if (payment_status) rows = rows.filter(o => o.payment_status === payment_status);
        if (showroom_id)    rows = rows.filter(o => o.showroom_id    === showroom_id);
        if (from_date)      rows = rows.filter(o => new Date(o.created_at) >= new Date(from_date));
        if (to_date)        rows = rows.filter(o => new Date(o.created_at) <= new Date(to_date));

        const lim = parseInt(limit), off = parseInt(offset);
        res.json({ success: true, data: rows.slice(off, off + lim), total: rows.length });
    } catch (err) {
        console.error('[orders list error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id — order detail with items and payments
router.get('/:id', auth, async (req, res) => {
    const supabase = getSupabase();
    try {
        const { data: orders, error: oErr } = await supabase
            .from('customer_order').select('*').eq('order_id', req.params.id).limit(1);
        if (oErr) throw new Error(oErr.message);
        if (!orders?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = orders[0];

        // Enrich customer
        let customer = {};
        if (order.customer_id) {
            const { data: custs } = await supabase.from('customer').select('name,mobile,email').eq('customer_id', order.customer_id).limit(1);
            customer = custs?.[0] || {};
        }

        // Fetch items
        const { data: rawItems } = await supabase.from('order_item').select('*').eq('order_id', req.params.id);
        const items = rawItems || [];

        // Enrich items with product names and variant SKU
        const prodIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
        const varIds  = [...new Set(items.map(i => i.variant_id).filter(Boolean))];
        let prodMap = {}, varMap = {};
        if (prodIds.length) {
            const { data: prods } = await supabase.from('product').select('product_id,product_name,hsn_code').in('product_id', prodIds);
            prodMap = Object.fromEntries((prods||[]).map(p => [p.product_id, p]));
        }
        if (varIds.length) {
            const { data: vars } = await supabase.from('variant').select('variant_id,sku,color_code').in('variant_id', varIds);
            varMap = Object.fromEntries((vars||[]).map(v => [v.variant_id, v]));
        }
        const enrichedItems = items.map(i => ({
            ...i,
            product_name: prodMap[i.product_id]?.product_name || '',
            hsn_code:     prodMap[i.product_id]?.hsn_code     || '',
            sku:          varMap[i.variant_id]?.sku           || '',
            color:        varMap[i.variant_id]?.color_code    || ''
        }));

        // Fetch payments
        const { data: payments } = await supabase.from('payment').select('*').eq('order_id', req.params.id);

        res.json({ success: true, data: { ...order, customer_name: customer.name || 'Walk-in', customer_mobile: customer.mobile || '', items: enrichedItems, payments: payments || [] } });
    } catch (err) {
        console.error('[order detail error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
});

// POST /api/orders — Create POS or ecommerce order
router.post('/', auth, async (req, res) => {
    const {
        business_id, customer_id, showroom_id, order_type, items,
        payment_mode, amount_paid, discount_amount = 0,
        subtotal: passedSubtotal, tax_amount: passedTax, total_amount: passedTotal
    } = req.body;

    if (!items || !items.length)
        return res.status(400).json({ success: false, error: 'Order must have at least one item' });

    const supabase = getSupabase();
    const order_id = `ord_${Date.now()}`;
    const invoice_number = `INV-${Date.now()}`;

    try {
        const calculatedSubtotal = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0));
        const subtotal    = passedSubtotal !== undefined ? passedSubtotal : calculatedSubtotal;
        const netAmount   = Math.round(subtotal - parseFloat(discount_amount || 0));
        const taxRate     = 18; // Default; can be fetched from tax_rules if needed
        const calculatedTax = Math.round(netAmount - (netAmount / (1 + taxRate / 100)));
        const tax_amount  = passedTax !== undefined ? passedTax : calculatedTax;
        const total_amount = passedTotal !== undefined ? passedTotal : netAmount;
        const balance_amount = Math.round(total_amount - parseFloat(amount_paid || 0));
        const payment_status = balance_amount <= 0 ? 'paid' : (parseFloat(amount_paid || 0) > 0 ? 'partial' : 'pending');

        // 1. Insert order
        const { error: oErr } = await supabase.from('customer_order').insert({
            order_id, business_id, customer_id: customer_id || null,
            showroom_id: showroom_id || null, order_type: order_type || 'POS',
            subtotal, discount_amount, tax_amount, total_amount,
            total_paid: amount_paid || 0, balance_amount, payment_status,
            order_status: 'Completed', invoice_number
        });
        if (oErr) throw new Error('Order insert: ' + oErr.message);

        // 2. Insert items + deduct inventory
        for (const item of items) {
            const v_id = (item.variant_id && item.variant_id !== 'null' && item.variant_id !== 'undefined') ? item.variant_id : null;
            const item_id = `item_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
            const total_price = Math.round((parseFloat(item.unit_price) * parseInt(item.quantity)) - parseFloat(item.discount || 0));

            const { error: iErr } = await supabase.from('order_item').insert({
                item_id, order_id,
                product_id: item.product_id,
                variant_id: v_id,
                item_type:  item.item_type  || 'frame',
                lens_type:  item.lens_type  || null,
                prescription_id: item.prescription_id || null,
                quantity:   parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price),
                discount:   parseFloat(item.discount || 0),
                total_price
            });
            if (iErr) console.error('[order_item insert error]', iErr.message);

            // Deduct inventory
            if (v_id && showroom_id) {
                const { data: inv } = await supabase.from('inventory')
                    .select('inventory_id,available_qty').eq('variant_id', v_id).eq('showroom_id', showroom_id).limit(1);
                if (inv?.[0]) {
                    await supabase.from('inventory').update({
                        available_qty: Math.max(0, inv[0].available_qty - parseInt(item.quantity))
                    }).eq('inventory_id', inv[0].inventory_id);
                }
            }
        }

        // 3. Log payment
        if (parseFloat(amount_paid || 0) > 0) {
            await supabase.from('payment').insert({
                payment_id: `pay_${Date.now()}`,
                order_id, business_id,
                amount:       parseFloat(amount_paid),
                payment_mode: payment_mode || 'Cash',
                status:       'success'
            });
        }

        res.status(201).json({ success: true, order_id, invoice_number, total_amount, balance_amount });
    } catch (err) {
        console.error('[create order error]', err.message);
        res.status(500).json({ success: false, error: 'Order creation failed: ' + err.message });
    }
});

// POST /api/orders/:id/payment — Record additional payment
router.post('/:id/payment', auth, async (req, res) => {
    const { amount, payment_mode, business_id } = req.body;
    const supabase = getSupabase();
    try {
        await supabase.from('payment').insert({
            payment_id:   `pay_${Date.now()}`,
            order_id:     req.params.id,
            business_id,
            amount:       parseFloat(amount),
            payment_mode: payment_mode || 'Cash',
            status:       'success'
        });
        // Update order totals
        const { data: ord } = await supabase.from('customer_order').select('total_paid,balance_amount,total_amount').eq('order_id', req.params.id).limit(1);
        if (ord?.[0]) {
            const newPaid    = parseFloat(ord[0].total_paid || 0) + parseFloat(amount);
            const newBalance = parseFloat(ord[0].total_amount) - newPaid;
            await supabase.from('customer_order').update({
                total_paid:     newPaid,
                balance_amount: Math.max(0, newBalance),
                payment_status: newBalance <= 0 ? 'paid' : 'partial'
            }).eq('order_id', req.params.id);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[payment record error]', err.message);
        res.status(500).json({ success: false, error: 'Payment recording failed' });
    }
});

// PATCH /api/orders/:id — Update order status / notes
router.patch('/:id', auth, async (req, res) => {
    const { order_status, notes } = req.body;
    const supabase = getSupabase();
    try {
        const update = {};
        if (order_status) update.order_status = order_status;
        if (notes !== undefined) update.notes = notes;
        const { error } = await supabase.from('customer_order').update(update).eq('order_id', req.params.id).eq('business_id', req.user.business_id);
        if (error) throw new Error(error.message);
        res.json({ success: true });
    } catch (err) {
        console.error('[update order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/pos-order — Create Optical POS Order (frame + lens booking with advance payment)
// MUST be registered BEFORE /:id routes
router.post('/pos-order', auth, async (req, res) => {
    const {
        business_id, customer_id, showroom_id,
        frame_product_id, frame_variant_id, frame_price, frame_mrp,
        lens_type, lens_price = 0,
        right_sph, right_cyl, right_axis, right_add,
        left_sph, left_cyl, left_axis, left_add, pd, notes,
        advance_amount = 0, payment_mode = 'Cash',
        delivery_date
    } = req.body;

    if (!frame_product_id) return res.status(400).json({ success: false, error: 'Frame product is required' });
    if (!customer_id)      return res.status(400).json({ success: false, error: 'Customer is required for POS Order' });

    const supabase    = getSupabase();
    const order_id    = `ord_${Date.now()}`;
    const booking_no  = `BKG-${Date.now()}`;  // Booking number (not final invoice)
    const ts          = Date.now();

    try {
        // 1. Save prescription
        const prescription_id = `rx_${ts}`;
        const { error: rxErr } = await supabase.from('prescription').insert({
            prescription_id,
            business_id,
            customer_id,
            right_sph:  right_sph  || null,
            right_cyl:  right_cyl  || null,
            right_axis: right_axis ? parseInt(right_axis) : null,
            right_add:  right_add  || null,
            left_sph:   left_sph   || null,
            left_cyl:   left_cyl   || null,
            left_axis:  left_axis  ? parseInt(left_axis) : null,
            left_add:   left_add   || null,
            pd:         pd         || null,
            notes:      notes      || null
        });
        if (rxErr) console.error('[prescription insert]', rxErr.message); // Non-fatal

        // 2. Calculate totals
        const frameMrp    = parseFloat(frame_mrp   || frame_price || 0);
        const framePrice  = parseFloat(frame_price || 0);
        const lensAmount  = parseFloat(lens_price   || 0);
        const subtotal    = frameMrp + lensAmount;
        const discount    = Math.max(0, frameMrp - framePrice);
        const netAmount   = subtotal - discount;
        const taxRate     = 18;
        const tax_amount  = Math.round(netAmount - (netAmount / (1 + taxRate / 100)));
        const total_amount = Math.round(netAmount);
        const adv         = parseFloat(advance_amount || 0);
        const balance_amount = Math.max(0, total_amount - adv);
        const payment_status = adv >= total_amount ? 'paid' : adv > 0 ? 'partial' : 'pending';

        // 3. Insert order (Processing = in-lab)
        const { error: oErr } = await supabase.from('customer_order').insert({
            order_id,
            business_id,
            customer_id,
            showroom_id:    showroom_id || null,
            order_type:     'POS-ORDER',    // distinct from POS direct
            subtotal,
            discount_amount: discount,
            tax_amount,
            total_amount,
            total_paid:     adv,
            balance_amount,
            payment_status,
            order_status:   'Processing',  // Frame+lens being prepared
            invoice_number: booking_no,    // Booking # only; final INV generated on delivery
            delivery_date:  delivery_date || null
        });
        if (oErr) throw new Error('Order insert: ' + oErr.message);

        // 4. Insert frame item
        const frame_item_id = `item_${ts}_frame`;
        const v_id = (frame_variant_id && frame_variant_id !== 'null') ? frame_variant_id : null;
        await supabase.from('order_item').insert({
            item_id:         frame_item_id,
            order_id,
            product_id:      frame_product_id,
            variant_id:      v_id,
            item_type:       'frame',
            lens_type:       lens_type || null,
            prescription_id: rxErr ? null : prescription_id,
            quantity:        1,
            unit_price:      frameMrp,
            discount:        discount,
            total_price:     framePrice
        });

        // 5. Insert lens line item (if price given)
        if (lensAmount > 0) {
            await supabase.from('order_item').insert({
                item_id:         `item_${ts}_lens`,
                order_id,
                product_id:      frame_product_id, // linked to same frame for report grouping
                item_type:       'lens',
                lens_type:       lens_type || 'Single Vision',
                prescription_id: rxErr ? null : prescription_id,
                quantity:        1,
                unit_price:      lensAmount,
                discount:        0,
                total_price:     lensAmount
            });
        }

        // 6. Record advance payment
        if (adv > 0) {
            await supabase.from('payment').insert({
                payment_id:   `pay_${ts}`,
                order_id,
                business_id,
                amount:       adv,
                payment_mode: payment_mode || 'Cash',
                status:       'success',
                notes:        'Advance / Booking Payment'
            });
        }

        res.status(201).json({
            success: true,
            order_id,
            booking_no,
            total_amount,
            advance_paid: adv,
            balance_amount,
            message: `Order booked. Balance due on delivery: ₹${balance_amount}`
        });
    } catch (err) {
        console.error('[pos-order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:id/deliver — Mark order delivered: record final payment + generate final invoice
router.post('/:id/deliver', auth, async (req, res) => {
    const { final_amount_paid, payment_mode = 'Cash', business_id } = req.body;
    const supabase = getSupabase();
    const biz = business_id || req.user.business_id;
    try {
        // Fetch current order
        const { data: ord } = await supabase.from('customer_order').select('*').eq('order_id', req.params.id).eq('business_id', biz).limit(1);
        if (!ord?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = ord[0];

        const finalPmt   = parseFloat(final_amount_paid || 0);
        const newPaid    = parseFloat(order.total_paid  || 0) + finalPmt;
        const newBalance = Math.max(0, parseFloat(order.total_amount) - newPaid);
        const pyStatus   = newBalance <= 0 ? 'paid' : 'partial';
        const final_invoice = `INV-${Date.now()}`;  // Real invoice on delivery

        // Record final payment
        if (finalPmt > 0) {
            await supabase.from('payment').insert({
                payment_id:   `pay_${Date.now()}`,
                order_id:     req.params.id,
                business_id:  biz,
                amount:       finalPmt,
                payment_mode: payment_mode,
                status:       'success',
                notes:        'Final Payment on Delivery'
            });
        }

        // Update order to Completed
        await supabase.from('customer_order').update({
            order_status:   'Completed',
            payment_status: pyStatus,
            total_paid:     newPaid,
            balance_amount: newBalance,
            invoice_number: final_invoice  // Replace booking# with real invoice#
        }).eq('order_id', req.params.id);

        res.json({
            success: true,
            invoice_number: final_invoice,
            balance_amount: newBalance,
            payment_status: pyStatus,
            message: 'Order delivered and final invoice generated'
        });
    } catch (err) {
        console.error('[deliver order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


('/:id', auth, async (req, res) => {
    const supabase = getSupabase();
    try {
        // 1. Get items to restore stock
        const { data: order } = await supabase.from('customer_order').select('showroom_id,business_id').eq('order_id', req.params.id).eq('business_id', req.user.business_id).limit(1);
        if (!order?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });

        const { data: items } = await supabase.from('order_item').select('variant_id,quantity').eq('order_id', req.params.id);
        for (const item of (items || [])) {
            if (item.variant_id && order[0].showroom_id) {
                const { data: inv } = await supabase.from('inventory').select('inventory_id,available_qty').eq('variant_id', item.variant_id).eq('showroom_id', order[0].showroom_id).limit(1);
                if (inv?.[0]) {
                    await supabase.from('inventory').update({ available_qty: inv[0].available_qty + parseInt(item.quantity) }).eq('inventory_id', inv[0].inventory_id);
                }
            }
        }

        // 2. Delete related records
        await supabase.from('payment').delete().eq('order_id', req.params.id);
        await supabase.from('order_item').delete().eq('order_id', req.params.id);
        await supabase.from('customer_order').delete().eq('order_id', req.params.id).eq('business_id', req.user.business_id);

        res.json({ success: true, message: 'Order deleted and stock restored' });
    } catch (err) {
        console.error('[delete order error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to delete order: ' + err.message });
    }
});

module.exports = router;

