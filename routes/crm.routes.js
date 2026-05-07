// routes/crm.routes.js — Leads + Follow-ups
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/crm/ping — Connectivity check
router.get('/ping', async (req, res) => res.json({ success: true, message: 'CRM Engine active' }));

// GET /api/crm/leads — List leads with advanced filters
router.get('/leads', auth, async (req, res) => {
    const { business_id, status, source, search, limit = 50, offset = 0 } = req.query;
    const biz = business_id || req.user.business_id;

    try {
        // Simple query — proxy handles the "lead" table correctly without subqueries
        const { rows: allLeads } = await db.query(
            `SELECT * FROM "lead" WHERE business_id = $1 ORDER BY created_at DESC`,
            [biz]
        );

        // Apply JS-side filters
        let leads = allLeads;
        if (status && status !== '')  leads = leads.filter(l => l.status === status);
        if (source && source !== '')  leads = leads.filter(l => l.source === source);
        if (search && search !== '')  {
            const t = search.toLowerCase();
            leads = leads.filter(l =>
                (l.name   || '').toLowerCase().includes(t) ||
                (l.mobile || '').toLowerCase().includes(t)
            );
        }

        // Enrich with follow_up counts via Supabase directly (no proxy subquery needed)
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const leadIds = leads.map(l => l.lead_id);

        let followUpMap = {};
        if (leadIds.length > 0) {
            const { data: followUps } = await supabase
                .from('follow_up')
                .select('lead_id, followup_date')
                .in('lead_id', leadIds);

            (followUps || []).forEach(f => {
                if (!followUpMap[f.lead_id]) followUpMap[f.lead_id] = { count: 0, last: null };
                followUpMap[f.lead_id].count++;
                if (!followUpMap[f.lead_id].last || f.followup_date > followUpMap[f.lead_id].last) {
                    followUpMap[f.lead_id].last = f.followup_date;
                }
            });
        }

        const lim = parseInt(limit); const off = parseInt(offset);
        const rows = leads.slice(off, off + lim).map(l => ({
            ...l,
            follow_up_count: followUpMap[l.lead_id]?.count || 0,
            last_follow_up:  followUpMap[l.lead_id]?.last  || null
        }));

        res.json({ success: true, data: rows, total: leads.length });
    } catch (err) {
        console.error('[CRM leads GET error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// GET /api/crm/kpis — CRM Dashboard Metrics
router.get('/kpis', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        // Fetch all leads directly via Supabase — no proxy subquery issues
        const { data: allLeads } = await supabase.from('lead').select('lead_id,status,created_at').eq('business_id', business_id);
        const leads = allLeads || [];

        const cutoff30 = new Date(); cutoff30.setDate(cutoff30.getDate() - 30);
        const stats = leads.reduce((acc, l) => {
            const key = (l.status || 'unknown').toLowerCase();
            acc[key] = (acc[key] || 0) + 1;
            acc.total += 1;
            return acc;
        }, { total: 0 });

        const newLeads  = leads.filter(l => new Date(l.created_at) >= cutoff30).length;
        const converted = leads.filter(l => l.status === 'Converted').length;
        const convRate  = stats.total > 0 ? (converted / stats.total * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: { pipeline: stats, recentGrowth: newLeads, conversionRates: convRate }
        });
    } catch (err) {
        console.error('[CRM KPI error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// GET /api/crm/leads/:id — Lead 360° View
router.get('/leads/:id', auth, async (req, res) => {
    try {
        const lead = await db.query(`SELECT * FROM "lead" WHERE lead_id = $1`, [req.params.id]);
        if (!lead.rows[0]) return res.status(404).json({ success: false, error: 'Lead not found' });

        const [activities, followUps] = await Promise.all([
            db.query(`SELECT * FROM lead_activity WHERE lead_id = $1 ORDER BY created_at DESC`, [req.params.id]),
            db.query(`SELECT * FROM follow_up WHERE lead_id = $1 ORDER BY followup_date DESC`, [req.params.id])
        ]);

        res.json({
            success: true,
            data: {
                ...lead.rows[0],
                activities: activities.rows,
                followUps: followUps.rows
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/crm/leads — Create Lead
router.post('/leads', auth, async (req, res) => {
    const { business_id, name, mobile, source, interest, assigned_to, notes } = req.body;
    if (!name || !mobile) return res.status(400).json({ success: false, error: 'Name and mobile required' });
    
    const lead_id = `lead_${Date.now()}`;
    const bizId = business_id || req.user.business_id;
    
    try {
        await db.query('BEGIN');
        await db.query(
            `INSERT INTO "lead" (lead_id, business_id, name, mobile, source, interest, assigned_to, notes, status) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'New')`,
            [lead_id, bizId, name, mobile, source, interest, assigned_to, notes]
        );
        
        await db.query(
            `INSERT INTO lead_activity (activity_id, lead_id, business_id, activity_type, description)
             VALUES ($1,$2,$3,$4,$5)`,
            [`act_${Date.now()}`, lead_id, bizId, 'Registration', `Lead manually registered via ERP`]
        );
        
        await db.query('COMMIT');
        res.status(201).json({ success: true, lead_id });
    } catch (err) { 
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// POST /api/crm/leads/:id/convert — Convert Lead to Customer
router.post('/leads/:id/convert', auth, async (req, res) => {
    const business_id = req.user.business_id;
    try {
        await db.query('BEGIN');
        const { rows } = await db.query(`SELECT * FROM "lead" WHERE lead_id = $1`, [req.params.id]);
        if (!rows[0]) throw new Error('Lead not found');
        const lead = rows[0];

        const customer_id = `cust_${Date.now()}`;
        // Create Customer
        await db.query(
            `INSERT INTO customer (customer_id, business_id, name, mobile, notes) 
             VALUES ($1,$2,$3,$4,$5) ON CONFLICT (mobile, business_id) DO NOTHING`,
            [customer_id, business_id, lead.name, lead.mobile, `Converted from Lead: ${lead.lead_id}`]
        );

        // Update Lead Status
        await db.query(`UPDATE "lead" SET status = 'Converted' WHERE lead_id = $1`, [req.params.id]);

        // Log Activity
        await db.query(
            `INSERT INTO lead_activity (activity_id, lead_id, business_id, activity_type, description)
             VALUES ($1,$2,$3,$4,$5)`,
            [`act_${Date.now()}`, req.params.id, business_id, 'Conversion', `Lead converted to customer profile: ${customer_id}`]
        );

        await db.query('COMMIT');
        res.json({ success: true, customer_id });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/crm/leads/:id/status
router.patch('/leads/:id/status', auth, async (req, res) => {
    const { status, remarks } = req.body;
    try {
        await db.query('BEGIN');
        const { rows: old } = await db.query(`SELECT status FROM "lead" WHERE lead_id = $1`, [req.params.id]);
        
        await db.query(`UPDATE "lead" SET status=$1 WHERE lead_id=$2`, [status, req.params.id]);
        
        await db.query(
            `INSERT INTO lead_activity (activity_id, lead_id, business_id, activity_type, description, old_value, new_value)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [`act_${Date.now()}`, req.params.id, req.user.business_id, 'Status Change', remarks || 'Manual status update', old[0]?.status, status]
        );
        
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) { 
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// GET /api/crm/follow-ups
router.get('/follow-ups', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    try {
        const { rows } = await db.query(
            `SELECT f.*, l.name AS lead_name, l.mobile FROM follow_up f 
             LEFT JOIN "lead" l ON f.lead_id=l.lead_id 
             WHERE f.business_id=$1 ORDER BY f.followup_date ASC`,
            [business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/crm/follow-ups
router.post('/follow-ups', auth, async (req, res) => {
    const { business_id, lead_id, customer_id, followup_date, note, type } = req.body;
    const followup_id = `fu_${Date.now()}`;
    const bizId = business_id || req.user.business_id;
    try {
        await db.query(
            `INSERT INTO follow_up (followup_id, business_id, lead_id, customer_id, followup_date, note, status) 
             VALUES ($1,$2,$3,$4,$5,$6,'Pending')`,
            [followup_id, bizId, lead_id, customer_id, followup_date, note]
        );
        
        if (lead_id) {
            await db.query(
                `INSERT INTO lead_activity (activity_id, lead_id, business_id, activity_type, description)
                 VALUES ($1,$2,$3,$4,$5)`,
                [`act_${Date.now()}`, lead_id, bizId, 'Follow-up Scheduled', `New follow-up set for ${followup_date}`]
            );
        }
        
        res.status(201).json({ success: true, followup_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
