-- ============================================================
-- BrightBoard Phase 3 — Tenant Core System & Subscriptions
-- Run this in the Supabase SQL Editor AFTER Phase 2
-- ============================================================

-- ─── 1. TENANT ENTITY (FINAL STRUCTURE) ──────────────────────────────────────
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS logo TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#672AEA',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#F0A026',
  ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_teachers INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_white_label BOOLEAN DEFAULT FALSE;

-- Update existing tenants to be active natively if they were not to avoid breaking legacy Phase 1
UPDATE tenants SET is_active = true WHERE subscription_plan = 'free' OR subscription_plan IS NULL;

-- ─── 2. SUBSCRIPTION TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- institute / personal_teacher
  amount NUMERIC NOT NULL,
  billing_cycle TEXT NOT NULL, -- monthly / yearly
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. PAYMENT TABLE (RAZORPAY INTEGRATION BASE) ────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. LEADS TABLE (CRM BASE) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ENABLE ROW LEVEL SECURITY ────────────────────────────────────────────
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;

-- ─── 6. RLS POLICIES ─────────────────────────────────────────────────────────

-- Tenant Subscriptions
DROP POLICY IF EXISTS "tenant_read_subscriptions" ON tenant_subscriptions;
CREATE POLICY "tenant_read_subscriptions"
  ON tenant_subscriptions FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Payments
DROP POLICY IF EXISTS "tenant_read_payments" ON payments;
CREATE POLICY "tenant_read_payments"
  ON payments FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Leads
DROP POLICY IF EXISTS "tenant_admin_read_leads" ON leads;
CREATE POLICY "tenant_admin_read_leads"
  ON leads FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (
       EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner'))
    )
  );

-- Lead Creation Context for Public API
DROP POLICY IF EXISTS "public_insert_leads" ON leads;
CREATE POLICY "public_insert_leads"
  ON leads FOR INSERT
  WITH CHECK (true); -- Usually gated by edge function or anon key context
