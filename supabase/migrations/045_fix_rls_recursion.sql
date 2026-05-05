-- ============================================================
-- Migration 045: Fix Recursive RLS Policies (Schema Cache Crash Fix)
-- This migration resolves the "Database error querying schema" on login.
-- Root cause: Several RLS policies query `user_profiles` from within policies
-- on OTHER tables, creating a recursive loop that crashes PostgREST.
-- ============================================================

-- ─── STEP 1: DROP ALL KNOWN RECURSIVE / BROKEN POLICIES ──────────────────────

-- From 002_rbac_permissions.sql (queries user_profiles from role_permissions/audit_logs)
DROP POLICY IF EXISTS "read_role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "admin_read_audit" ON public.audit_logs;

-- From 001_initial_schema.sql (queries user_profiles from user_profiles - self-recursive)
DROP POLICY IF EXISTS "tenant_member_read" ON public.user_profiles;
DROP POLICY IF EXISTS "tenant_admin_update" ON public.user_profiles;
DROP POLICY IF EXISTS "tenant_self_read" ON public.tenants;

-- From 020_user_profiles_rbac_policy.sql (queries user_profiles from user_profiles)
DROP POLICY IF EXISTS "staff_read_profiles" ON public.user_profiles;

-- From previous fix attempts (all variants)
DROP POLICY IF EXISTS "tenant_member_read_v2" ON public.user_profiles;
DROP POLICY IF EXISTS "users_self_read_v2" ON public.user_profiles;
DROP POLICY IF EXISTS "owner_full_access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_all" ON public.user_profiles;
DROP POLICY IF EXISTS "staff_read_non_recursive" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_self_read" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_owner_all" ON public.user_profiles;
DROP POLICY IF EXISTS "users_self_access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_all" ON public.user_profiles;


-- ─── STEP 2: REBUILD user_profiles POLICIES (Non-Recursive) ──────────────────
-- Use direct column comparison. No subqueries against the same table.

-- Self access: user can read/write their own row
DROP POLICY IF EXISTS "users_self_read" ON public.user_profiles;
CREATE POLICY "users_self_read" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_self_update" ON public.user_profiles;
CREATE POLICY "users_self_update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin bypass: Use service_role key in the API. RLS is irrelevant for admin queries.
-- The Next.js login API already uses supabaseAdmin (service role) which bypasses RLS.


-- ─── STEP 3: REBUILD role_permissions POLICY (Non-Recursive) ─────────────────
-- Old policy queried user_profiles, causing the crash. New one just allows all authenticated.

DROP POLICY IF EXISTS "read_role_permissions_safe" ON public.role_permissions;
CREATE POLICY "read_role_permissions_safe" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');


-- ─── STEP 4: REBUILD audit_logs POLICY (Non-Recursive) ───────────────────────
-- Old policy queried user_profiles causing the crash.

DROP POLICY IF EXISTS "admin_read_audit_safe" ON public.audit_logs;
CREATE POLICY "admin_read_audit_safe" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');


-- ─── STEP 5: FIX tenants POLICY (Non-Recursive) ──────────────────────────────
DROP POLICY IF EXISTS "tenant_access_v2" ON public.tenants;
DROP POLICY IF EXISTS "allow_tenant_read" ON public.tenants;

-- Allow all authenticated users to read tenants (owner sees all via service role)
DROP POLICY IF EXISTS "tenants_authenticated_read" ON public.tenants;
CREATE POLICY "tenants_authenticated_read" ON public.tenants
  FOR SELECT USING (auth.role() = 'authenticated');


-- ─── STEP 6: RESTORE SCHEMA GRANTS ───────────────────────────────────────────
-- Re-grant permissions in case they were lost during table drops/recreations.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;


-- ─── STEP 7: ENSURE OWNER PROFILE EXISTS ─────────────────────────────────────
-- Sync the owner profile with whatever UUID exists in auth.users for that email.
DO $$
DECLARE
    v_owner_id UUID;
    v_instance UUID;
BEGIN
    -- Get the real instance_id from an existing auth user (not hardcoded zero)
    SELECT instance_id INTO v_instance FROM auth.users LIMIT 1;

    -- Ensure owner@brightboard.in exists in auth.users
    -- First check if it already exists
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@brightboard.in';

    IF v_owner_id IS NULL THEN
        -- Create with the real instance_id
        v_owner_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password,
            email_confirmed_at, aud, role,
            raw_app_meta_data, raw_user_meta_data
        ) VALUES (
            v_owner_id,
            COALESCE(v_instance, '00000000-0000-0000-0000-000000000000'),
            'owner@brightboard.in',
            crypt('Demo@123', gen_salt('bf')),
            NOW(),
            'authenticated',
            'authenticated',
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"role": "owner"}'::jsonb
        );
    ELSE
        -- Update password to ensure it's correct
        UPDATE auth.users
        SET encrypted_password = crypt('Demo@123', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'::jsonb),
            raw_user_meta_data = '{"role": "owner"}'::jsonb
        WHERE id = v_owner_id;
    END IF;

    -- Sync the profile row
    INSERT INTO public.user_profiles (id, email, role, is_active, is_first_login, first_name, last_name)
    VALUES (v_owner_id, 'owner@brightboard.in', 'owner', TRUE, FALSE, 'System', 'Owner')
    ON CONFLICT (id) DO UPDATE SET
        role = 'owner',
        is_active = TRUE,
        is_first_login = FALSE;
END $$;


-- ─── STEP 8: FORCE SCHEMA CACHE REFRESH ──────────────────────────────────────
NOTIFY pgrst, 'reload schema';

SELECT 'Migration 045 complete. RLS recursion fixed. Owner profile synced.' AS status;
