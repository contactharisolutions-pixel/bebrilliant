// routes/communication.routes.js — Advanced Multi-Channel Campaigns & Bulk Messaging
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// ── Helper: guard that allows Admin, Manager, Marketing ──────────────────────
function commGuard(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated' });
    const allowed = ['Admin', 'Manager', 'Marketing'];
    if (!allowed.includes(req.user.role))
        return res.status(403).json({ success: false, error: 'Access denied' });
    next();
}

// ── CUSTOMER GROUPS (SEGMENTATION) ───────────────────────────────────────────

// GET /api/comm/groups
router.get('/groups', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM customer_groups WHERE business_id = $1 ORDER BY created_at DESC',
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /groups GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/groups
router.post('/groups', auth, commGuard, async (req, res) => {
    try {
        const { name, description, is_manual, filter_rules, customer_ids } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Group name is required' });

        const group_id    = `grp_${Date.now()}`;
        const business_id = req.user.business_id;
        const isManual    = is_manual === 'true' || is_manual === true;

        await db.query('BEGIN');
        await db.query(
            `INSERT INTO customer_groups (group_id, business_id, name, description, filter_rules, is_manual)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [group_id, business_id, name, description || '', JSON.stringify(filter_rules || {}), isManual]
        );

        if (isManual && Array.isArray(customer_ids) && customer_ids.length > 0) {
            for (const cid of customer_ids) {
                await db.query(
                    'INSERT INTO customer_group_members (group_id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [group_id, cid]
                );
            }
        }

        await db.query('COMMIT');
        res.status(201).json({ success: true, group_id });
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        console.error('[COMM] /groups POST error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/comm/groups/:id/members — list members of a group
router.get('/groups/:id/members', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.customer_id, c.name, c.mobile, c.email 
             FROM customer c 
             JOIN customer_group_members gm ON c.customer_id = gm.customer_id
             WHERE gm.group_id = $1`,
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── CAMPAIGNS ────────────────────────────────────────────────────────────────

// GET /api/comm/campaigns
router.get('/campaigns', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.*,
                    g.name AS group_name,
                    (SELECT COUNT(*) FROM campaign_logs cl WHERE cl.campaign_id = c.campaign_id)::int AS total_sent,
                    (SELECT COUNT(*) FROM campaign_logs cl WHERE cl.campaign_id = c.campaign_id AND cl.status = 'delivered')::int AS total_delivered
             FROM campaigns c
             LEFT JOIN customer_groups g ON c.group_id = g.group_id
             WHERE c.business_id = $1
             ORDER BY c.created_at DESC`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /campaigns GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/campaigns
router.post('/campaigns', auth, commGuard, async (req, res) => {
    try {
        const { name, channel, type, group_id, template_id, scheduled_for, metadata } = req.body;
        if (!name || !channel) return res.status(400).json({ success: false, error: 'Name and channel are required' });

        const campaign_id = `camp_${Date.now()}`;
        const business_id = req.user.business_id;
        const meta        = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});

        const { rows } = await db.query(
            `INSERT INTO campaigns (campaign_id, business_id, name, channel, type, group_id, template_id, scheduled_for, metadata)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [campaign_id, business_id, name, (channel || 'whatsapp').toLowerCase(), type || 'Promotional',
             group_id || null, template_id || null, scheduled_for || null, JSON.stringify(meta)]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[COMM] /campaigns POST error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/campaigns/:id/execute — Bulk send
router.post('/campaigns/:id/execute', auth, commGuard, async (req, res) => {
    const { id }        = req.params;
    const business_id   = req.user.business_id;

    try {
        const campRes = await db.query(
            'SELECT * FROM campaigns WHERE campaign_id = $1 AND business_id = $2',
            [id, business_id]
        );
        if (!campRes.rows.length)
            return res.status(404).json({ success: false, error: 'Campaign not found' });

        const camp    = campRes.rows[0];
        let customers = [];

        if (camp.group_id) {
            const grp = await db.query('SELECT is_manual FROM customer_groups WHERE group_id = $1', [camp.group_id]);
            if (grp.rows.length) {
                if (grp.rows[0].is_manual) {
                    const mem = await db.query(
                        'SELECT c.* FROM customer c JOIN customer_group_members gm ON c.customer_id = gm.customer_id WHERE gm.group_id = $1',
                        [camp.group_id]
                    );
                    customers = mem.rows;
                } else {
                    // Auto-group: all customers
                    const all = await db.query('SELECT * FROM customer WHERE business_id = $1', [business_id]);
                    customers = all.rows;
                }
            }
        } else {
            const all = await db.query('SELECT * FROM customer WHERE business_id = $1', [business_id]);
            customers = all.rows;
        }

        await db.query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', ['Running', id]);

        // Fetch template content
        let templateContent = 'Hello {{name}}, you have a new notification from BlinkOpticals!';
        if (camp.template_id) {
            const tRes = await db.query('SELECT message_content FROM message_templates WHERE id = $1::int', [parseInt(camp.template_id, 10)]);
            if (tRes.rows.length) templateContent = tRes.rows[0].message_content;
        }

        // Metadata product links
        const meta          = camp.metadata || {};
        const productLinks  = (meta.product_ids || [])
            .map(pid => `\n🔗 https://blinkopticals.com/shop/p/${pid}`)
            .join('');

        // Process each customer
        for (const cust of customers) {
            const msg = templateContent
                .replace(/{{name}}/gi,    cust.name    || 'Customer')
                .replace(/{{mobile}}/gi,  cust.mobile  || '')
                .replace(/{{email}}/gi,   cust.email   || '')
                + productLinks;

            console.log(`[BULK SEND] → ${cust.mobile || cust.email}: ${msg.substring(0, 60)}...`);

            await db.query(
                `INSERT INTO campaign_logs (campaign_id, customer_id, mobile, email, status)
                 VALUES ($1,$2,$3,$4,$5)`,
                [id, cust.customer_id, cust.mobile || null, cust.email || null, 'sent']
            );
        }

        await db.query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', ['Completed', id]);
        res.json({ success: true, processed_counts: customers.length, message: `${customers.length} messages queued` });
    } catch (err) {
        await db.query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', ['Failed', id]).catch(() => {});
        console.error('[COMM] /execute error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/comm/campaigns/:id
router.delete('/campaigns/:id', auth, commGuard, async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query(
            'DELETE FROM campaigns WHERE campaign_id = $1 AND business_id = $2',
            [id, req.user.business_id]
        );
        if (!rowCount) return res.status(404).json({ success: false, error: 'Campaign not found' });
        // Clean up associated logs
        await db.query('DELETE FROM campaign_logs WHERE campaign_id = $1', [id]).catch(() => {});
        res.json({ success: true });
    } catch (err) {
        console.error('[COMM] /campaigns DELETE error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/comm/campaigns/:id/status — update lifecycle status
router.patch('/campaigns/:id/status', auth, commGuard, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Draft', 'Running', 'Completed', 'Paused'];
        if (!allowed.includes(status))
            return res.status(400).json({ success: false, error: 'Invalid status' });
        await db.query(
            'UPDATE campaigns SET status = $1 WHERE campaign_id = $2 AND business_id = $3',
            [status, req.params.id, req.user.business_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/comm/campaign-stats — aggregate KPIs
router.get('/campaign-stats', auth, async (req, res) => {
    try {
        const biz = req.user.business_id;
        const { rows } = await db.query(
            `SELECT
                COUNT(*)                                          AS total,
                COUNT(*) FILTER (WHERE status = 'Running')       AS running,
                COUNT(*) FILTER (WHERE status = 'Draft')         AS drafts,
                COUNT(*) FILTER (WHERE status = 'Completed')     AS completed,
                COALESCE(SUM(
                    (SELECT COUNT(*) FROM campaign_logs cl WHERE cl.campaign_id = c.campaign_id)
                ),0)::int AS total_sent
             FROM campaigns c WHERE c.business_id = $1`,
            [biz]
        );
        const d = rows[0];
        res.json({ success: true, data: {
            total: +d.total, running: +d.running, drafts: +d.drafts,
            completed: +d.completed, totalSent: +d.total_sent
        }});
    } catch (err) {
        console.error('[COMM] /campaign-stats error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// ── TEMPLATES ────────────────────────────────────────────────────────────────

// GET /api/comm/templates
router.get('/templates', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM message_templates WHERE business_id = $1 ORDER BY created_at DESC',
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /templates GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/templates
router.post('/templates', auth, commGuard, async (req, res) => {
    try {
        const { template_name, channel, message_content, variables } = req.body;
        if (!template_name || !message_content)
            return res.status(400).json({ success: false, error: 'Name and content are required' });

        const { rows } = await db.query(
            `INSERT INTO message_templates (business_id, template_name, channel, message_content, variables)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [req.user.business_id, template_name, (channel || 'whatsapp').toLowerCase(), message_content, JSON.stringify(variables || [])]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[COMM] /templates POST error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── LOGS ────────────────────────────────────────────────────────────────────

// GET /api/comm/logs — last 100 log entries for this business
router.get('/logs', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT cl.log_id, cl.mobile, cl.email, cl.status, cl.sent_at,
                    cl.customer_id, c.name AS customer_name,
                    camp.name AS campaign_name, camp.channel
             FROM campaign_logs cl
             JOIN  campaigns camp ON cl.campaign_id = camp.campaign_id
             LEFT JOIN customer c ON cl.customer_id = c.customer_id
             WHERE camp.business_id = $1
             ORDER BY cl.sent_at DESC
             LIMIT 100`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /logs GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/comm/notifications — List system notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM system_notifications WHERE business_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/comm/notifications/:id/read — Mark as read
router.patch('/notifications/:id/read', auth, async (req, res) => {
    try {
        await db.query(
            'UPDATE system_notifications SET status = \'read\' WHERE notification_id = $1 AND business_id = $2',
            [req.params.id, req.user.business_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
