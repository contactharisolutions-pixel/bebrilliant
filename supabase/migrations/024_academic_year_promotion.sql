-- ============================================================
-- BrightBoard Phase 24 — Academic Year & Student Promotion
-- ============================================================

-- 1. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "2025-2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENT ACADEMIC RECORDS (History)
CREATE TABLE IF NOT EXISTS public.student_academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class TEXT NOT NULL,
  division TEXT,
  roll_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'failed', 'graduated', 'left')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASS PROMOTION RULES
CREATE TABLE IF NOT EXISTS public.class_promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_class TEXT NOT NULL,
  to_class TEXT NOT NULL, -- "Graduated" is a special value
  auto_promote BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, from_class)
);

-- 4. PROMOTION LOGS
CREATE TABLE IF NOT EXISTS public.promotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  promoted_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  graduated_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. UPDATE USER_PROFILES
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS current_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- 6. RLS POLICIES
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_logs ENABLE ROW LEVEL SECURITY;

-- Tenant users can read their institution's academic years
CREATE POLICY "tenant_read_academic_years" ON public.academic_years
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Tenant admins can manage academic years
CREATE POLICY "tenant_admin_manage_years" ON public.academic_years
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner') AND tenant_id = academic_years.tenant_id
    )
  );

-- Student academic records access
CREATE POLICY "user_read_academic_records" ON public.student_academic_records
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- Promotion rules management
CREATE POLICY "tenant_admin_manage_rules" ON public.class_promotion_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner') AND tenant_id = class_promotion_rules.tenant_id
    )
  );

-- 7. INDEXING
CREATE INDEX IF NOT EXISTS idx_acad_year_tenant ON public.academic_years(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acad_record_student ON public.student_academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_acad_record_year ON public.student_academic_records(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_promo_rules_tenant ON public.class_promotion_rules(tenant_id);
