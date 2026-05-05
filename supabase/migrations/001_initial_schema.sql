-- ============================================================
-- BrightBoard Phase 1 — Database Foundation Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. TENANTS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  type                TEXT CHECK (type IN ('INSTITUTE', 'PERSONAL_TEACHER')) NOT NULL,
  email               TEXT,
  is_active           BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'expired')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. USER PROFILES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name     TEXT,
  last_name      TEXT,
  email          TEXT,
  phone          TEXT,
  role           TEXT NOT NULL CHECK (role IN (
                   'owner',
                   'tenant_admin',
                   'teacher',
                   'teacher_pending',
                   'student',
                   'parent'
                 )),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE SET NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  is_first_login BOOLEAN DEFAULT TRUE,
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. ROLES TABLE (RBAC) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT
);

-- ─── 4. USER_ROLES (RBAC MAPPING) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id   UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ─── 5. SEED DEFAULT ROLES ───────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('owner',           'Platform owner — full system access'),
  ('tenant_admin',    'Institution administrator'),
  ('teacher',         'Approved teacher within a tenant'),
  ('teacher_pending', 'Teacher awaiting admin approval'),
  ('student',         'Student enrolled in a tenant'),
  ('parent',          'Parent of a student')
ON CONFLICT (name) DO NOTHING;

-- ─── 6. ENABLE ROW LEVEL SECURITY ────────────────────────────────────────────
ALTER TABLE tenants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles    ENABLE ROW LEVEL SECURITY;

-- ─── 7. RLS POLICIES — USER_PROFILES ─────────────────────────────────────────

-- Self: user can read/update their own profile
CREATE POLICY "users_self_read"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_self_update"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tenant isolation: tenant members can see profiles in same tenant
CREATE POLICY "tenant_member_read"
  ON user_profiles FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Tenant admin can update profiles within their tenant
CREATE POLICY "tenant_admin_update"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tenant_admin', 'owner')
        AND (
          role = 'owner'
          OR tenant_id = user_profiles.tenant_id
        )
    )
  );

-- ─── 8. RLS POLICIES — TENANTS ───────────────────────────────────────────────

-- Anyone (authenticated) can read their own tenant info
CREATE POLICY "tenant_self_read"
  ON tenants FOR SELECT
  USING (
    id = (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Owners can see all tenants
CREATE POLICY "owner_read_all_tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ─── 9. RLS POLICIES — ROLES ─────────────────────────────────────────────────

-- All authenticated users can read role definitions
CREATE POLICY "authenticated_read_roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── 10. RLS POLICIES — USER_ROLES ──────────────────────────────────────────

-- Users can read their own role mappings
CREATE POLICY "users_self_read_roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Tenant admins can read roles of their tenant members
CREATE POLICY "tenant_admin_read_roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tenant_admin', 'owner')
        AND (role = 'owner' OR tenant_id = user_roles.tenant_id)
    )
  );

-- ─── 11. HELPER FUNCTION: Get current user's role ─────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

-- ─── 12. HELPER FUNCTION: Get current user's tenant ──────────────────────────
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid();
$$;

-- ─── 13. TRIGGER: Auto-create profile on auth.users insert ───────────────────
-- (Optional: normally our API creates the profile, but this is a safety net)
-- Uncomment if you want automatic profile creation (minimal data only):
/*
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
*/
