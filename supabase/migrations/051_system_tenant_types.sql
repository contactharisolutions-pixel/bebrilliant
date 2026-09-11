-- ============================================================
-- Migration 051 — System Tenant Types Alignment
-- Align plans table and tenant constraints with the 3 system tenant types:
-- 1. school (School / K-12)
-- 2. institute (Institute / Coaching)
-- 3. independent_teacher (Individual Teacher / Tutor, personal_teacher alias)
-- ============================================================

-- 1. Update plans.type check constraint
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_type_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_type_check 
    CHECK (type IN ('school', 'institute', 'independent_teacher', 'personal_teacher'));

-- 2. Ensure tenants.tenant_type has the 3 canonical types
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_tenant_type_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_tenant_type_check
    CHECK (tenant_type IN ('school', 'institute', 'independent_teacher'));

-- 3. Ensure tenants.type also permits SCHOOL if legacy column is queried
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_type_check
    CHECK (type IN ('SCHOOL', 'INSTITUTE', 'PERSONAL_TEACHER'));
