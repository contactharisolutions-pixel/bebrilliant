-- ============================================================
-- BrightBoard Phase 12 — Subscription Management System
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. PLANS TABLE (OWNER CONTROL) ─────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('institute', 'personal_teacher')),
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  max_students INT NOT NULL DEFAULT 0,
  max_teachers INT NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{"ai_mentor": false, "adaptive_exam": false, "white_label": false}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. TENANT SUBSCRIPTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled', 'past_due')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. INVOICES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. ADD FEATURES TO TENANT ──────────────────────────────
-- In order to control features at the tenant level if a plan is assigned
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"ai_mentor": false, "adaptive_exam": false, "white_label": false}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- ─── 5. ROW LEVEL SECURITY (RLS) ────────────────────────────
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Plans are readable by anyone, modifiable by owners
DROP POLICY IF EXISTS "public_read_plans" ON plans;
CREATE POLICY "public_read_plans" ON plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_all_plans" ON plans;
CREATE POLICY "owner_all_plans" ON plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Tenant subscriptions: Tenants can read their own, owners can manage all
DROP POLICY IF EXISTS "tenant_read_own_subs" ON tenant_subscriptions;
CREATE POLICY "tenant_read_own_subs" ON tenant_subscriptions FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "owner_all_subs" ON tenant_subscriptions;
CREATE POLICY "owner_all_subs" ON tenant_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Invoices: Tenants can read their own, owners can manage all
DROP POLICY IF EXISTS "tenant_read_own_invoices" ON invoices;
CREATE POLICY "tenant_read_own_invoices" ON invoices FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "owner_all_invoices" ON invoices;
CREATE POLICY "owner_all_invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Seed Initial Plans
INSERT INTO plans (name, type, price, billing_cycle, max_students, max_teachers, features)
VALUES 
  ('Starter', 'institute', 4999, 'monthly', 100, 5, '{"ai_mentor": false, "adaptive_exam": false, "white_label": false}'),
  ('Pro', 'institute', 14999, 'monthly', 500, 20, '{"ai_mentor": true, "adaptive_exam": true, "white_label": false}'),
  ('Enterprise', 'institute', 49999, 'monthly', 5000, 100, '{"ai_mentor": true, "adaptive_exam": true, "white_label": true}'),
  ('Solo Tutor', 'personal_teacher', 1999, 'monthly', 50, 1, '{"ai_mentor": true, "adaptive_exam": false, "white_label": false}')
ON CONFLICT DO NOTHING;
