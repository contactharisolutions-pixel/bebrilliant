-- ============================================================
-- Migration 033: Student-Parent Mapping via Login ID
-- Adds parent_login_id FK to user_profiles for student
-- ============================================================

-- 1. Add parent_login_id column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS parent_login_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for fast parent lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_login_id
  ON user_profiles(parent_login_id);

-- 3. Ensure students can read/update their own parent_login_id (already covered by self-update policy)
-- Ensure parents can read profiles where they are linked as parent
DROP POLICY IF EXISTS "parent_can_read_linked_student" ON user_profiles;
CREATE POLICY "parent_can_read_linked_student"
  ON user_profiles FOR SELECT
  USING (
    parent_login_id = auth.uid()
  );

-- 4. RPC to look up a parent profile by their auth email (used in student profile form)
CREATE OR REPLACE FUNCTION lookup_parent_by_email(p_email TEXT, p_tenant_id UUID)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    up.id,
    CONCAT(up.first_name, ' ', up.last_name) AS full_name,
    up.email
  FROM user_profiles up
  WHERE up.email = p_email
    AND up.role = 'parent'
    AND up.tenant_id = p_tenant_id
  LIMIT 1;
$$;

COMMENT ON COLUMN user_profiles.parent_login_id IS
  'UUID of the parent user_profiles.id (auth.users) who is mapped to this student for the Parent Dashboard.';
