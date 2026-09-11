-- ============================================================
-- Migration 054 — Tenant Capacity Columns & Plan Alignment
-- Run locally via pg client
-- ============================================================

-- 1. Ensure tenants table has max_storage_gb, max_ai_tokens, and updated_at
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 50;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_ai_tokens INTEGER DEFAULT 25000;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Link Silver Bells School to School (Basic) plan if not linked
UPDATE public.tenants 
SET 
    current_plan_id = '873d0da6-43ea-4016-8e36-7e9b3026819f',
    subscription_plan = 'School (Basic)',
    max_students = 500,
    max_teachers = 25,
    max_storage_gb = 100,
    max_ai_tokens = 25000,
    features = '{"ai_mentor": true, "adaptive_exam": false, "white_label": false, "live_classes": true, "attendance": true, "parent_portal": true, "analytics_reports": true, "custom_certs": false, "bulk_sms": true, "marketplace": false}'::jsonb
WHERE id = 'c9adb96a-985f-436b-bda9-63c20f80588e' AND (current_plan_id IS NULL OR subscription_plan = 'free');

-- 3. Also sync active row in tenant_subscriptions
UPDATE public.tenant_subscriptions
SET 
    plan_id = '873d0da6-43ea-4016-8e36-7e9b3026819f',
    plan_name = 'School (Basic)',
    plan_type = 'school',
    amount = 5999
WHERE tenant_id = 'c9adb96a-985f-436b-bda9-63c20f80588e' AND status = 'active';
