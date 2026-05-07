/**
 * Initialize Accounting Module Tables
 */
const { Pool } = require('pg');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const schema = `
-- 1. Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'income', 'expense', 'equity')),
    parent_account_id TEXT REFERENCES accounts(account_id),
    code TEXT,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    journal_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    reference_type TEXT, -- 'sale', 'purchase', 'expense', 'payment', 'manual'
    reference_id TEXT, -- invoice_id, expense_id etc
    notes TEXT,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Journal Lines (Double-Entry Debit/Credit)
CREATE TABLE IF NOT EXISTS journal_lines (
    line_id SERIAL PRIMARY KEY,
    journal_id TEXT REFERENCES journal_entries(journal_id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(account_id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    memo TEXT
);

-- 4. Expenses (Specific tracking with Bill/Media)
CREATE TABLE IF NOT EXISTS expenses (
    expense_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    account_id TEXT REFERENCES accounts(account_id),
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    payee TEXT,
    payment_mode TEXT, -- 'Cash', 'Bank', 'UPI', 'Card'
    reference_no TEXT,
    notes TEXT,
    bill_image TEXT, -- Media Library URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payments (Standalone payments/receipts)
CREATE TABLE IF NOT EXISTS payments (
    payment_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    payment_type TEXT CHECK (payment_type IN ('incoming', 'outgoing')),
    amount DECIMAL(15,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payment_mode TEXT,
    reference_type TEXT, -- 'order', 'invoice', 'vendor_bill'
    reference_id TEXT,
    account_id TEXT REFERENCES accounts(account_id), -- Bank or Cash account used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Log for Accounting
CREATE TABLE IF NOT EXISTS accounting_log (
    log_id SERIAL PRIMARY KEY,
    business_id TEXT NOT NULL,
    action TEXT,
    details TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const seedData = `
-- Default accounts for a demo business
INSERT INTO accounts (account_id, business_id, account_name, account_type, code) VALUES
('acc_cash_001', 'biz_blink_001', 'Cash in Hand', 'asset', '1001'),
('acc_bank_001', 'biz_blink_001', 'Main Bank Account', 'asset', '1002'),
('acc_inventory_001', 'biz_blink_001', 'Inventory Asset', 'asset', '1003'),
('acc_gst_pay_001', 'biz_blink_001', 'GST Payable', 'liability', '2001'),
('acc_creditors_001', 'biz_blink_001', 'Account Payables (Creditors)', 'liability', '2002'),
('acc_sales_001', 'biz_blink_001', 'Product Sales', 'income', '3001'),
('acc_others_001', 'biz_blink_001', 'Other Income', 'income', '3002'),
('acc_rent_001', 'biz_blink_001', 'Office/Showroom Rent', 'expense', '4001'),
('acc_salary_001', 'biz_blink_001', 'Staff Salary', 'expense', '4002'),
('acc_marketing_001', 'biz_blink_001', 'Marketing & Ads', 'expense', '4003'),
('acc_repairs_001', 'biz_blink_001', 'Maintenance & Repairs', 'expense', '4004')
ON CONFLICT (account_id) DO NOTHING;
`;

async function init() {
    try {
        console.log('--- Initializing Accounting Schema ---');
        await pool.query(schema);
        console.log('Table structures created.');
        
        await pool.query(seedData);
        console.log('Default accounts seeded.');
        
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed:', err.message);
        process.exit(1);
    }
}

init();
