-- Migration 034: CRM, Demo Allocation & Onboarding Lifecycle

-- 1. Modify user_profiles role check constraint to include sales_exec, demo_exec, and onboarding_spec
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN (
  'owner',
  'sales_exec',
  'demo_exec',
  'onboarding_spec',
  'tenant_admin',
  'teacher',
  'teacher_pending',
  'student',
  'parent'
));

-- 2. Seed default roles into roles lookup table
INSERT INTO roles (name, description) VALUES
  ('sales_exec',       'Sales Executive - platform lead management'),
  ('demo_exec',        'Demo Executive - platform product demonstrations'),
  ('onboarding_spec',  'Onboarding Specialist - platform tenant setup')
ON CONFLICT (name) DO NOTHING;

-- 3. Extend owner_leads with tenant_id linkage and allocation timestamp
ALTER TABLE owner_leads
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS allocated_at TIMESTAMPTZ;

-- 4. Extend demos with conducted_by allocation (staff UUID)
ALTER TABLE demos
  ADD COLUMN IF NOT EXISTS conducted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Create onboarding_checklists table to track post-provisioning tasks
CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tasks             JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes             TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS on onboarding_checklists
ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for onboarding_checklists
-- Platform owners/staff can manage all checklists
DROP POLICY IF EXISTS "owner_access_onboarding" ON onboarding_checklists;
CREATE POLICY "owner_access_onboarding" ON onboarding_checklists FOR ALL
USING (
  assigned_staff_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('owner', 'sales_exec', 'demo_exec', 'onboarding_spec')
  )
);
