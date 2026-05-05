-- ============================================================
-- Migration 043: DEMO SEED DATA (Final Clean Version)
-- ============================================================

BEGIN;

-- 1. SCHEMA SYNC
ALTER TABLE IF EXISTS tenants ADD COLUMN IF NOT EXISTS tenant_type TEXT DEFAULT 'institute';
ALTER TABLE IF EXISTS user_profiles ADD COLUMN IF NOT EXISTS parent_login_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. RESILIENT PURGE
DO $$
DECLARE
    v_table TEXT;
    v_tables TEXT[] := ARRAY['affiliate_withdrawals', 'affiliate_transactions', 'affiliate_wallets', 'affiliate_students', 'affiliate_teachers', 'affiliate_settings', 'affiliate_referrals', 'wallet_transactions', 'student_wallets', 'user_profiles', 'tenants'];
BEGIN
    FOREACH v_table IN ARRAY v_tables LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = v_table AND table_schema = 'public') THEN
            EXECUTE format('DELETE FROM public.%I', v_table);
        END IF;
    END LOOP;
END $$;

-- 3. SEED AUTH USERS
DO $$
DECLARE
    v_u RECORD;
    v_accounts JSONB := '[
        {"id": "a1111111-1111-1111-1111-111111111111", "email": "admin@brilliantacademy.edu"},
        {"id": "a4444444-4444-4444-4444-444444444444", "email": "rahul.student@brilliantacademy.edu"},
        {"id": "a6666666-6666-6666-6666-666666666666", "email": "suresh.parent@brilliantacademy.edu"}
    ]'::jsonb;
BEGIN
    FOR v_u IN SELECT * FROM jsonb_to_recordset(v_accounts) AS x(id UUID, email TEXT) LOOP
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role)
        VALUES (v_u.id, '00000000-0000-0000-0000-000000000000', v_u.email, crypt('Demo@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated')
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- 4. SEED TENANTS
INSERT INTO tenants (id, name, type, tenant_type, email, is_active)
VALUES 
    ('11111111-0000-0000-0000-000000000001', 'Brilliant Academy', 'INSTITUTE', 'institute', 'admin@brilliantacademy.edu', TRUE),
    ('22222222-0000-0000-0000-000000000002', 'Sunrise Public School', 'INSTITUTE', 'school', 'admin@sunriseschool.edu', TRUE),
    ('33333333-0000-0000-0000-000000000003', 'Rahul Shah Classes', 'PERSONAL_TEACHER', 'independent_teacher', 'rahul@shahclasses.com', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED PROFILES
INSERT INTO user_profiles (id, email, role, tenant_id, is_active, parent_login_id)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'admin@brilliantacademy.edu', 'tenant_admin', '11111111-0000-0000-0000-000000000001', TRUE, NULL),
    ('a6666666-6666-6666-6666-666666666666', 'suresh.parent@brilliantacademy.edu', 'parent', '11111111-0000-0000-0000-000000000001', TRUE, NULL),
    ('a4444444-4444-4444-4444-444444444444', 'rahul.student@brilliantacademy.edu', 'student', '11111111-0000-0000-0000-000000000001', TRUE, 'a6666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

COMMIT;
