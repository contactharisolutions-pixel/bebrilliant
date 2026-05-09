-- ============================================================
-- BrightBoard Phase 7 — CRM, Marketing & Automation Engine
-- Run this in the Supabase SQL Editor AFTER Phase 6
-- ============================================================

-- ─── 1. OWNER CRM SYSTEM (Platform Level) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'lost')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Sales Exec ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. TENANT CRM SYSTEM (Tenant Level) ─────────────────────────────────────
-- Note: Reusing/extending the leads table from Phase 3, explicitly renaming conceptual scope
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
  notes TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. AUTOMATION & NOTIFICATION ENGINE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Null means global owner rule
  event TEXT NOT NULL,          -- e.g. 'signup', 'payment_success', 'low_score', 'exam_reminder'
  condition JSONB NOT NULL,     -- e.g. {"score": "<40"}
  action JSONB NOT NULL,        -- e.g. {"type": "send_email", "template_id": "xyz"}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,           -- Can contain variables like {{student_name}}, {{exam_name}}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
ALTER TABLE owner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── 5. SECURITY POLICIES ────────────────────────────────────────────────────

-- Owner CRM: Only Owners or assigned Sales Execs see owner CRM data
DROP POLICY IF EXISTS "owner_access_owner_leads" ON owner_leads;
CREATE POLICY "owner_access_owner_leads" ON owner_leads FOR ALL 
USING (
  assigned_to = auth.uid() 
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

DROP POLICY IF EXISTS "owner_access_demos" ON demos;
CREATE POLICY "owner_access_demos" ON demos FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM owner_leads 
    WHERE id = demos.lead_id AND (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'))
  )
);

-- Tenant CRM Activities
DROP POLICY IF EXISTS "tenant_staff_access_activities" ON lead_activities;
CREATE POLICY "tenant_staff_access_activities" ON lead_activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM leads 
    JOIN user_profiles up ON up.id = auth.uid()
    WHERE leads.id = lead_activities.lead_id AND leads.tenant_id = up.tenant_id AND up.role IN ('tenant_admin', 'owner', 'sales_exec')
  )
);

-- Automation & Templates
DROP POLICY IF EXISTS "tenant_staff_access_automation" ON automation_rules;
CREATE POLICY "tenant_staff_access_automation" ON automation_rules FOR SELECT 
USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  OR tenant_id IS NULL 
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Notifications (Users read their own)
DROP POLICY IF EXISTS "user_access_notifications" ON notifications;
CREATE POLICY "user_access_notifications" ON notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "user_update_notifications" ON notifications FOR UPDATE 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── 6. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON automation_rules(tenant_id);
