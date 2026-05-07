// routes/invoice.routes.js — GST Invoice Data Engine (Supabase direct)
'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// GET /api/invoice/:order_id — Fetch all data for printing
router.get('/:order_id', auth, async (req, res) => {
    try {
        const { order_id } = req.params;
        const business_id  = req.user.business_id;
        const supabase     = getSupabase();

        // 1. Fetch order
        const { data: orders, error: oErr } = await supabase
            .from('customer_order').select('*')
            .eq('order_id', order_id).eq('business_id', business_id).limit(1);
        if (oErr || !orders?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = orders[0];

        // 2. Fetch related entities in parallel
        const [
            { data: custArr },
            { data: showroomArr },
            { data: bizArr },
            { data: rawItems },
            { data: settingsArr }
        ] = await Promise.all([
            order.customer_id
                ? supabase.from('customer').select('name,mobile,email,city,gender,notes').eq('customer_id', order.customer_id).limit(1)
                : Promise.resolve({ data: [] }),
            order.showroom_id
                ? supabase.from('showroom').select('showroom_name,address,city,contact_number').eq('showroom_id', order.showroom_id).limit(1)
                : Promise.resolve({ data: [] }),
            supabase.from('business').select('business_name,email,mobile_number,address,city,state').eq('business_id', business_id).limit(1),
            supabase.from('order_item').select('*').eq('order_id', order_id),
            supabase.from('business_settings').select('setting_value').eq('business_id', business_id).eq('setting_key', 'gst_settings').limit(1)
        ]);

        const customer  = custArr?.[0]    || {};
        const showroom  = showroomArr?.[0] || {};
        const biz       = bizArr?.[0]     || {};
        const items     = rawItems        || [];
        const gstSettings = settingsArr?.[0]?.setting_value || {};

        // 3. Enrich items with product names
        const prodIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
        let prodMap = {};
        if (prodIds.length) {
            const { data: prods } = await supabase
                .from('product').select('product_id,product_name,hsn_code,category_id').in('product_id', prodIds);
            prodMap = Object.fromEntries((prods || []).map(p => [p.product_id, p]));
        }

        // 4. Calculate totals
        const total_amount     = parseFloat(order.total_amount || 0);
        const subtotal         = parseFloat(order.subtotal     || 0) ||
            items.reduce((s, i) => s + parseFloat(i.unit_price || 0) * parseInt(i.quantity || 0), 0);
        const discount_amount  = parseFloat(order.discount_amount || 0);
        const sumItemTotals    = items.reduce((s, i) => s + parseFloat(i.total_price || 0), 0);
        const sharedDiscount   = Math.max(0, sumItemTotals - total_amount);

        let calcTax = 0, calcTaxable = 0;

        const enrichedItems = items.map(i => {
            const qty               = parseInt(i.quantity || 1);
            const mrp               = parseFloat(i.unit_price || 0);
            const itemDisc          = parseFloat(i.discount || 0);
            const itemAfterOffer    = (mrp * qty) - itemDisc;
            const weight            = sumItemTotals > 0 ? itemAfterOffer / sumItemTotals : 0;
            const itemSharedDisc    = sharedDiscount * weight;
            const totalItemDiscount = itemDisc + itemSharedDisc;
            const netAmount         = itemAfterOffer - itemSharedDisc;
            const taxPercent        = 18; // default; extend with product_tax_mapping if needed
            const taxableValue      = netAmount / (1 + taxPercent / 100);
            const taxValue          = netAmount - taxableValue;

            calcTax     += taxValue;
            calcTaxable += taxableValue;

            return {
                ...i,
                product_name:   prodMap[i.product_id]?.product_name || 'Unknown Product',
                hsn_code:       prodMap[i.product_id]?.hsn_code     || '9004',
                tax_percent:    taxPercent,
                total_discount: parseFloat(totalItemDiscount.toFixed(2)),
                taxable_value:  parseFloat(taxableValue.toFixed(2)),
                cgst:           parseFloat((taxValue / 2).toFixed(2)),
                sgst:           parseFloat((taxValue / 2).toFixed(2)),
                net_amount:     parseFloat(netAmount.toFixed(2))
            };
        });

        const tax_amount = Math.round(calcTax);
        const cgst       = parseFloat((calcTax / 2).toFixed(2));
        const sgst       = parseFloat((calcTax / 2).toFixed(2));
        const invoice_no = order.invoice_number ||
            `INV-${new Date(order.created_at).getFullYear()}-${order.order_id.slice(-6)}`;

        res.json({
            success: true,
            invoice_data: {
                business: {
                    name:    biz.business_name || 'BlinkOpticals',
                    address: biz.address       || '',
                    city:    biz.city          || '',
                    state:   biz.state         || '',
                    mobile:  biz.mobile_number || '',
                    email:   biz.email         || '',
                    gstin:   gstSettings.gstin || 'N/A'
                },
                showroom: {
                    name:    showroom.showroom_name   || '',
                    address: showroom.address          || '',
                    city:    showroom.city             || '',
                    contact: showroom.contact_number   || ''
                },
                order: {
                    id:             order.order_id,
                    invoice_no,
                    created_at:     order.created_at,
                    type:           order.order_type,
                    status:         order.order_status,
                    payment_status: order.payment_status,
                    subtotal,
                    tax_amount,
                    discount_amount,
                    total_amount,
                    calculated_taxable: parseFloat(calcTaxable.toFixed(2))
                },
                customer: {
                    name:   customer.name   || 'Walk-in Customer',
                    mobile: customer.mobile || '',
                    email:  customer.email  || '',
                    city:   customer.city   || '',
                    gender: customer.gender || '',
                    notes:  customer.notes  || ''
                },
                items: enrichedItems,
                totals: {
                    subtotal,
                    tax_total:     tax_amount,
                    cgst,
                    sgst,
                    discount_total: discount_amount,
                    grand_total:    total_amount
                }
            }
        });

    } catch (err) {
        console.error('[invoice route error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
