-- ============================================================
-- BrightBoard Phase 2 — Granular RBAC, Permissions & Audit
-- Run this in the Supabase SQL Editor AFTER 001_initial_schema
-- ============================================================

-- ─── 1. TENANT TABLE UPDATES (Advanced Structure) ────────────────────────────
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;

-- ─── 2. USER ROLE ASSIGNMENT UPDATES ─────────────────────────────────────────
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT TRUE;

-- ─── 3. PERMISSIONS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL, -- e.g. exam.create
  description TEXT
);

-- ─── 4. ROLE PERMISSIONS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL means global
  UNIQUE NULLS NOT DISTINCT (role_id, permission_id, tenant_id)
);

-- ─── 5. AUDIT LOGS SYSTEM ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. SEED DATA (DEFAULT PERMISSIONS & ROLE ASSIGNMENTS) ───────────────────
-- Insert module permissions
INSERT INTO permissions (module, action, key, description) VALUES
  ('exam', 'create', 'exam.create', 'Create new exams'),
  ('exam', 'read', 'exam.read', 'View exams'),
  ('exam', 'update', 'exam.update', 'Edit existing exams'),
  ('exam', 'delete', 'exam.delete', 'Delete exams'),
  ('exam', 'publish', 'exam.publish', 'Publish exams to students'),
  
  ('question_bank', 'manage', 'question_bank.manage', 'Add/edit question banks'),
  ('students', 'manage', 'students.manage', 'Manage student records'),
  ('teachers', 'manage', 'teachers.manage', 'Manage teacher records'),
  ('crm', 'view', 'crm.view', 'View CRM data'),
  ('payments', 'manage', 'payments.manage', 'Manage billing and payments'),
  ('analytics', 'view', 'analytics.view', 'View tenant analytics'),
  ('ai', 'use', 'ai.use', 'Use AI generation tools')
ON CONFLICT (key) DO NOTHING;

-- Map basic permissions to default roles globally (tenant_id = null)
DO $$
DECLARE
  v_role_tenant_admin UUID;
  v_role_teacher UUID;
  v_role_student UUID;
  v_perm_exam_create UUID;
  v_perm_exam_read UUID;
BEGIN
  -- Get Role IDs
  SELECT id INTO v_role_tenant_admin FROM roles WHERE name = 'tenant_admin';
  SELECT id INTO v_role_teacher FROM roles WHERE name = 'teacher';
  SELECT id INTO v_role_student FROM roles WHERE name = 'student';
  
  -- Get Permission IDs
  SELECT id INTO v_perm_exam_create FROM permissions WHERE key = 'exam.create';
  SELECT id INTO v_perm_exam_read FROM permissions WHERE key = 'exam.read';

  -- Assign (ignoring conflicts due to UNIQUE constraint)
  IF v_role_tenant_admin IS NOT NULL AND v_perm_exam_create IS NOT NULL THEN
     INSERT INTO role_permissions (role_id, permission_id) VALUES (v_role_tenant_admin, v_perm_exam_create) ON CONFLICT DO NOTHING;
  END IF;

  IF v_role_teacher IS NOT NULL AND v_perm_exam_create IS NOT NULL THEN
     INSERT INTO role_permissions (role_id, permission_id) VALUES (v_role_teacher, v_perm_exam_create) ON CONFLICT DO NOTHING;
  END IF;

  IF v_role_student IS NOT NULL AND v_perm_exam_read IS NOT NULL THEN
     INSERT INTO role_permissions (role_id, permission_id) VALUES (v_role_student, v_perm_exam_read) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ─── 7. ENABLE ROW LEVEL SECURITY (RLS) ──────────────────────────────────────
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── 8. RLS POLICIES ─────────────────────────────────────────────────────────

-- Permissions: Everyone authenticated can read the permission catalog
DROP POLICY IF EXISTS "authenticated_read_permissions" ON permissions;
CREATE POLICY "authenticated_read_permissions"
  ON permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Role Permissions: Users can read roles mapped globally or to their tenant
DROP POLICY IF EXISTS "read_role_permissions" ON role_permissions;
CREATE POLICY "read_role_permissions"
  ON role_permissions FOR SELECT
  USING (
    tenant_id IS NULL OR
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- Audit Logs: Only Owner and Tenant Admin can read audit logs
DROP POLICY IF EXISTS "admin_read_audit" ON audit_logs;
CREATE POLICY "admin_read_audit"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tenant_admin', 'owner')
        AND (role = 'owner' OR tenant_id = audit_logs.tenant_id)
    )
  );

-- Audit Logs: Internal operations can insert audit logs
DROP POLICY IF EXISTS "authenticated_insert_audit" ON audit_logs;
CREATE POLICY "authenticated_insert_audit"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
