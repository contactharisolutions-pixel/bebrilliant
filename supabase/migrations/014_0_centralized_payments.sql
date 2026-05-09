-- ============================================================
-- BrightBoard Phase 14 — Centralized Payments & Auto Payout
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. PAYMENTS (MASTER RECORD) ──────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- References user_profiles (student/parent buying something)
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('subscription', 'syllabus', 'exam', 'marketplace')),
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure type column exists if table was created by a previous migration
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_type_check CHECK (type IN ('subscription', 'syllabus', 'exam', 'marketplace'));

-- ─── 2. WALLET SYSTEM ──────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_balance NUMERIC DEFAULT 0,
  commission_earned NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_wallet (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  available_balance NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_wallet (
  user_id UUID PRIMARY KEY, -- References user_profiles
  balance NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. COMMISSION CONFIGRULES ──────────────────────────
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('subscription', 'exam', 'syllabus', 'marketplace', 'global')),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL means global rule for this category
  category TEXT,
  percentage NUMERIC NOT NULL DEFAULT 10.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (type, tenant_id)
);

-- ─── 4. TRANSACTION SPLIT LOG ──────────────────────────
CREATE TABLE IF NOT EXISTS payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  owner_amount NUMERIC NOT NULL,
  tenant_amount NUMERIC NOT NULL,
  commission_percentage NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. PAYOUTS & BANK ACCOUNTS ────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  bank_name TEXT,
  account_holder_name TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processed', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  transaction_ref TEXT
);

-- ─── 6. ROW LEVEL SECURITY (RLS) ───────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Owner Access (All Tables)
CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "owner_all_payments" ON payments FOR ALL USING (is_owner());
CREATE POLICY "owner_all_owner_wallet" ON owner_wallet FOR ALL USING (is_owner());
CREATE POLICY "owner_all_tenant_wallet" ON tenant_wallet FOR ALL USING (is_owner());
CREATE POLICY "owner_all_affiliate_wallet" ON affiliate_wallet FOR ALL USING (is_owner());
CREATE POLICY "owner_all_commission_rules" ON commission_rules FOR ALL USING (is_owner());
CREATE POLICY "owner_all_payment_splits" ON payment_splits FOR ALL USING (is_owner());
CREATE POLICY "owner_all_bank_accounts" ON bank_accounts FOR ALL USING (is_owner());
CREATE POLICY "owner_all_payouts" ON payouts FOR ALL USING (is_owner());

-- Tenant Access (Their own data)
CREATE POLICY "tenant_read_wallet" ON tenant_wallet FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_bank" ON bank_accounts FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_update_bank" ON bank_accounts FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_payouts" ON payouts FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_insert_payouts" ON payouts FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Initialize Single Owner Wallet Record
INSERT INTO owner_wallet (id, total_balance, commission_earned) 
VALUES (gen_random_uuid(), 0, 0)
ON CONFLICT DO NOTHING;

-- Seed Default Global Commission Rules
INSERT INTO commission_rules (type, category, percentage, tenant_id) VALUES
  ('global', 'default', 15.0, NULL),
  ('subscription', 'platform_fee', 0.0, NULL), -- 100% owner revenue
  ('exam', 'fee_split', 20.0, NULL),
  ('marketplace', 'sales', 30.0, NULL)
ON CONFLICT DO NOTHING;
