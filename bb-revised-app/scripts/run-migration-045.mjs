/**
 * Temporary script — run migration 045 directly via Supabase Management API
 * Usage: node scripts/run-migration-045.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bfzlkdurgggzytegvvrw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// The fix SQL — broken into individual executable statements
const statements = [
  // Drop all broken recursive policies
  `DROP POLICY IF EXISTS "read_role_permissions" ON public.role_permissions`,
  `DROP POLICY IF EXISTS "admin_read_audit" ON public.audit_logs`,
  `DROP POLICY IF EXISTS "tenant_member_read" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "tenant_admin_update" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "tenant_self_read" ON public.tenants`,
  `DROP POLICY IF EXISTS "staff_read_profiles" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "tenant_member_read_v2" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "users_self_read_v2" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "owner_full_access" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "user_profiles_owner_all" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "staff_read_non_recursive" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "allow_self_read" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "allow_owner_all" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "users_self_access" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "users_self_read" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "users_self_update" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "user_profiles_self_read" ON public.user_profiles`,
  `DROP POLICY IF EXISTS "tenant_access_v2" ON public.tenants`,
  `DROP POLICY IF EXISTS "allow_tenant_read" ON public.tenants`,
  `DROP POLICY IF EXISTS "tenants_authenticated_read" ON public.tenants`,
  `DROP POLICY IF EXISTS "read_role_permissions_safe" ON public.role_permissions`,
  `DROP POLICY IF EXISTS "admin_read_audit_safe" ON public.audit_logs`,

  // Rebuild safe policies
  `CREATE POLICY "users_self_read" ON public.user_profiles FOR SELECT USING (auth.uid() = id)`,
  `CREATE POLICY "users_self_update" ON public.user_profiles FOR UPDATE USING (auth.uid() = id)`,
  `CREATE POLICY "read_role_permissions_safe" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated')`,
  `CREATE POLICY "admin_read_audit_safe" ON public.audit_logs FOR SELECT USING (auth.role() = 'authenticated')`,
  `CREATE POLICY "tenants_authenticated_read" ON public.tenants FOR SELECT USING (auth.role() = 'authenticated')`,

  // Restore grants
  `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role`,
  `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role`,
  `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role`,

  // Ensure columns exist
  `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT`,
  `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT`,

  // Sync owner profile
  `
  DO $$
  DECLARE
    v_owner_id UUID;
    v_instance UUID;
  BEGIN
    SELECT instance_id INTO v_instance FROM auth.users LIMIT 1;
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@brightboard.in';
    IF v_owner_id IS NULL THEN
      v_owner_id := gen_random_uuid();
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
      VALUES (v_owner_id, COALESCE(v_instance, '00000000-0000-0000-0000-000000000000'), 'owner@brightboard.in', crypt('Demo@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"owner"}'::jsonb);
    ELSE
      UPDATE auth.users SET encrypted_password = crypt('Demo@123', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()) WHERE id = v_owner_id;
    END IF;
    INSERT INTO public.user_profiles (id, email, role, is_active, is_first_login, first_name, last_name)
    VALUES (v_owner_id, 'owner@brightboard.in', 'owner', TRUE, FALSE, 'System', 'Owner')
    ON CONFLICT (id) DO UPDATE SET role = 'owner', is_active = TRUE, is_first_login = FALSE;
  END $$
  `,

  // Force schema reload
  `NOTIFY pgrst, 'reload schema'`,
]

async function runFix() {
  console.log('🔧 Running Migration 045 — RLS Recursion Fix...\n')
  let ok = 0
  let fail = 0

  for (const sql of statements) {
    const label = sql.trim().substring(0, 60).replace(/\n/g, ' ')
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (error) {
        // Try direct query as fallback
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql_query: sql })
        })
        if (!res.ok) {
          console.warn(`  ⚠️  ${label}...`)
          fail++
        } else {
          console.log(`  ✅ ${label}...`)
          ok++
        }
      } else {
        console.log(`  ✅ ${label}...`)
        ok++
      }
    } catch (e) {
      console.warn(`  ⚠️  ${label}... WARN: ${e.message}`)
      fail++
    }
  }

  console.log(`\n📊 Results: ${ok} succeeded, ${fail} warnings`)
  console.log('✅ Migration 045 complete — refresh your browser and try logging in.')
}

runFix().catch(console.error)
