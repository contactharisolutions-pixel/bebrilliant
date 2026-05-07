// routes/accounting.routes.js — Enterprise Accounting (Expenses, Payments, Ledger & Reports)
'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// ── ACCOUNTS (CHART OF ACCOUNTS) ──────────────────────────────────────────

// GET /api/accounting/accounts — Fetch COA
router.get('/accounts', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { rows } = await db.query(
            'SELECT * FROM accounts WHERE business_id = $1 AND active_status = true ORDER BY account_type, account_name',
            [business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/accounting/accounts
router.post('/accounts', auth, rbac('Admin'), async (req, res) => {
    const { account_name, account_type, parent_account_id, code } = req.body;
    const account_id = `acc_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO accounts (account_id, business_id, account_name, account_type, parent_account_id, code)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [account_id, req.user.business_id, account_name, account_type, parent_account_id || null, code]
        );
        res.status(201).json({ success: true, account_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── EXPENSES ──────────────────────────────────────────────────────────

// GET /api/accounting/expenses
router.get('/expenses', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { showroom_id, start_date, end_date } = req.query;
        
        let query = `
            SELECT e.*, a.account_name, s.showroom_name
            FROM expenses e 
            JOIN accounts a ON e.account_id = a.account_id 
            LEFT JOIN showroom s ON e.showroom_id = s.showroom_id
            WHERE e.business_id = $1
        `;
        const params = [business_id];
        let idx = 2;

        if (showroom_id) {
            query += ` AND e.showroom_id = $${idx++}`;
            params.push(showroom_id);
        }
        if (start_date && end_date) {
            query += ` AND e.date BETWEEN $${idx++} AND $${idx++}`;
            params.push(start_date, end_date);
        }

        query += ` ORDER BY e.date DESC`;
        
        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/accounting/expenses
router.post('/expenses', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { account_id, amount, date, payee, payment_mode, notes, bill_image, bank_account_id, showroom_id, tax_amount, reference_no } = req.body;
    const business_id = req.user.business_id;
    const sid = showroom_id || null;
    const expense_id = `exp_${Date.now()}`;
    const journal_id = `jrnl_exp_${Date.now()}`;

    try {
        await db.query('BEGIN');

        // 1. Expense Record
        await db.query(
            `INSERT INTO expenses (expense_id, business_id, account_id, amount, tax_amount, date, payee, payment_mode, reference_no, notes, bill_image, showroom_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [expense_id, business_id, account_id, amount, tax_amount || 0, date || new Date(), payee, payment_mode, reference_no, notes, bill_image, sid]
        );

        // 2. Journal Entry
        await db.query(
            `INSERT INTO journal_entries (journal_id, business_id, date, reference_type, reference_id, total_amount, notes, showroom_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [journal_id, business_id, date || new Date(), 'expense', expense_id, amount, `Expense: ${payee} - ${notes}`, sid]
        );

        // 3. Journal Lines
        await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, $2, $3, 0)`, [journal_id, account_id, amount]);
        const creditAccount = bank_account_id || (payment_mode === 'Cash' ? 'acc_cash_001' : 'acc_bank_001');
        await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, $2, 0, $3)`, [journal_id, creditAccount, amount]);

        await db.query('COMMIT');
        res.status(201).json({ success: true, expense_id });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── PAYMENTS ──────────────────────────────────────────────────────────

// GET /api/accounting/payments
router.get('/payments', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { showroom_id } = req.query;
        let query = `
            SELECT p.*, a.account_name, s.showroom_name
            FROM payments p 
            JOIN accounts a ON p.account_id = a.account_id 
            LEFT JOIN showroom s ON p.showroom_id = s.showroom_id
            WHERE p.business_id = $1
        `;
        const params = [business_id];
        if (showroom_id) {
            query += ` AND p.showroom_id = $2`;
            params.push(showroom_id);
        }
        query += ` ORDER BY p.date DESC`;
        
        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/accounting/payments
router.post('/payments', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { payment_type, amount, date, payment_mode, reference_type, reference_id, account_id, notes, showroom_id } = req.body;
    const business_id = req.user.business_id;
    const sid = showroom_id || null;
    const payment_id = `pay_${Date.now()}`;
    const journal_id = `jrnl_pay_${Date.now()}`;

    try {
        await db.query('BEGIN');

        await db.query(
            `INSERT INTO payments (payment_id, business_id, payment_type, amount, date, payment_mode, reference_type, reference_id, account_id, showroom_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [payment_id, business_id, payment_type, amount, date || new Date(), payment_mode, reference_type, reference_id, account_id, sid]
        );

        await db.query(
            `INSERT INTO journal_entries (journal_id, business_id, date, reference_type, reference_id, total_amount, notes, showroom_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [journal_id, business_id, date || new Date(), 'payment', payment_id, amount, `${payment_type.toUpperCase()}: ${notes || payment_mode}`, sid]
        );

        if (payment_type === 'incoming') {
            await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, $2, $3, 0)`, [journal_id, account_id, amount]);
            await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_sales_001', 0, $2)`, [journal_id, amount]);
        } else {
            await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_others_001', $2, 0)`, [journal_id, amount]);
            await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, $2, 0, $3)`, [journal_id, account_id, amount]);
        }

        await db.query('COMMIT');
        res.status(201).json({ success: true, payment_id });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── REPORTS ───────────────────────────────────────────────────────────

// GET /api/accounting/dashboard — KPIs for Accounting
router.get('/dashboard', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { showroom_id } = req.query;
        
        let conditions = ['business_id = $1'];
        let params = [business_id];
        let idx = 2;

        if (showroom_id) {
            conditions.push(`showroom_id = $${idx++}`);
            params.push(showroom_id);
        }

        const condStr = conditions.join(' AND ');

        const [income, expense, pending] = await Promise.all([
            db.query(`SELECT SUM(amount) as total FROM payments WHERE ${condStr} AND payment_type='incoming'`, params),
            db.query(`SELECT SUM(amount) as total FROM expenses WHERE ${condStr}`, params),
            db.query(`SELECT SUM(total_amount - total_paid) as total FROM customer_order WHERE ${condStr.replace('showroom_id', 'showroom_id')} AND order_status != 'Cancelled'`, params)
        ]);

        const inc = parseFloat(income.rows[0]?.total || 0);
        const exp = parseFloat(expense.rows[0]?.total || 0);
        const pend = parseFloat(pending.rows[0]?.total || 0);

        res.json({
            success: true,
            data: {
                total_income: inc,
                total_expense: exp,
                outstanding_receivables: pend,
                net_position: inc - exp
            }
        });
    } catch (err) { 
        console.error('[Accounting Dashboard Error]', err.message);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// GET /api/accounting/reports/pl — Profit & Loss
router.get('/reports/pl', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { start_date, end_date, showroom_id } = req.query;
        
        let conditions = ['je.business_id = $1', "a.account_type IN ('income', 'expense')"];
        let params = [business_id];
        let idx = 2;

        if (showroom_id) { conditions.push(`je.showroom_id = $${idx++}`); params.push(showroom_id); }
        if (start_date && end_date) { conditions.push(`je.date BETWEEN $${idx++} AND $${idx++}`); params.push(start_date, end_date); }

        const sql = `
            SELECT a.account_type, a.account_name, 
                   SUM(jl.debit_amount) as total_debit, 
                   SUM(jl.credit_amount) as total_credit
            FROM journal_lines jl
            JOIN journal_entries je ON jl.journal_id = je.journal_id
            JOIN accounts a ON jl.account_id = a.account_id
            WHERE ${conditions.join(' AND ')}
            GROUP BY a.account_type, a.account_name
        `;
        const { rows } = await db.query(sql, params);
        
        const report = { income: [], expense: [], total_income: 0, total_expense: 0, net_profit: 0 };
        rows.forEach(r => {
            const dr = parseFloat(r.total_debit || 0);
            const cr = parseFloat(r.total_credit || 0);
            if (r.account_type === 'income') {
                const amt = cr - dr;
                report.income.push({ name: r.account_name, amount: amt });
                report.total_income += amt;
            } else {
                const amt = dr - cr;
                report.expense.push({ name: r.account_name, amount: amt });
                report.total_expense += amt;
            }
        });
        report.net_profit = report.total_income - report.total_expense;
        res.json({ success: true, data: report });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── TRANSACTIONS ──────────────────────────────────────────────────────

router.get('/transactions', auth, async (req, res) => {
    try {
        const { business_id } = req.user;
        const { showroom_id } = req.query;
        let query = `
            SELECT je.*, s.showroom_name,
                   (SELECT json_agg(jl) FROM (
                       SELECT jl.*, a.account_name 
                       FROM journal_lines jl 
                       JOIN accounts a ON jl.account_id = a.account_id 
                       WHERE jl.journal_id = je.journal_id
                   ) jl) as lines
            FROM journal_entries je
            LEFT JOIN showroom s ON je.showroom_id = s.showroom_id
            WHERE je.business_id = $1
        `;
        const params = [business_id];
        if (showroom_id) {
            query += ` AND je.showroom_id = $2`;
            params.push(showroom_id);
        }
        query += ` ORDER BY je.date DESC, je.created_at DESC LIMIT 100`;
        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
