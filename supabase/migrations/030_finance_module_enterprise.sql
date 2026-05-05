-- ============================================================
-- BrightBoard Phase 30 — Enterprise Finance & Settlement Module
-- ============================================================

-- 1. ENHANCED COMMISSION RULES
-- Adding specific categories and override flags
ALTER TABLE IF EXISTS commission_rules 
ADD COLUMN IF NOT EXISTS is_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. SETTLEMENTS (Replacing/Enhancing Payouts)
-- Tracks gross, tds, charges and net paid to tenants
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  withdrawal_request_id UUID, -- Link to a request if applicable
  gross_amount NUMERIC NOT NULL,
  tds_amount NUMERIC DEFAULT 0,
  processing_fees NUMERIC DEFAULT 0,
  net_paid NUMERIC NOT NULL,
  payment_method TEXT, -- 'bank_transfer', 'upi', etc.
  transaction_ref TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'reversed')),
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. ENHANCED INVOICES
-- Support per-user, per-type, and GST calculations
ALTER TABLE IF EXISTS invoices
ADD COLUMN IF NOT EXISTS invoice_no TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('subscription', 'exam', 'wallet', 'commission', 'manual')),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS base_amount NUMERIC,
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
ADD COLUMN IF NOT EXISTS gst_percent NUMERIC DEFAULT 18.0,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 4. WITHDRAWAL REQUESTS
-- Advanced tracking for tenant payout requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'settled')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_note TEXT,
  tenant_note TEXT
);

-- 5. FINANCE CONFIGURATION in Platform Settings
-- Injecting enterprise finance parameters
INSERT INTO platform_settings (key, value) VALUES
  ('finance_config', '{
    "min_withdrawal_amount": 1000,
    "tds_percent": 10.0,
    "processing_fee_percent": 2.0,
    "gst_percent": 18.0,
    "payout_day": "Friday",
    "invoice_prefix": "BB-INV-",
    "pan_mandatory": true
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. RLS POLICIES
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Settlements Access
CREATE POLICY "owner_manage_settlements" ON settlements FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "tenant_read_settlements" ON settlements FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

-- Withdrawal Requests Access
CREATE POLICY "owner_manage_withdrawals" ON withdrawal_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "tenant_manage_own_withdrawals" ON withdrawal_requests FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

-- 7. INDEXING
CREATE INDEX IF NOT EXISTS idx_settlement_tenant ON settlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_tenant ON withdrawal_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_type ON invoices(type);
