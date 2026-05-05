-- ENHANCED RBAC POLICY FOR USER PROFILES
-- Allows staff to read profiles according to their scoped hierarchy.

DROP POLICY IF EXISTS "staff_read_profiles" ON user_profiles;
CREATE POLICY "staff_read_profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS requester
      WHERE requester.id = auth.uid()
        AND requester.role IN ('owner', 'tenant_admin', 'teacher')
        AND (
          requester.role = 'owner' OR 
          (requester.tenant_id IS NOT NULL AND requester.tenant_id = user_profiles.tenant_id)
        )
    )
  );

-- Ensure teachers can only update within their scope too if needed
-- For now, focused on SELECT resolving the Student Roster Directory empty view.
