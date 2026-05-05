-- ============================================================
-- BrightBoard Phase 21 — Advanced Exam Enrollment & Commerce
-- ============================================================

-- 1. EXAM ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.exam_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'paid', 'expired')),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

-- 2. COMMERCE CART
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('exam', 'syllabus')),
  item_id UUID NOT NULL, -- Logical reference
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, item_type, item_id)
);

-- 3. SCHEMA PATCH FOR ATTEMPT LIMITS
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS attempt_limit INTEGER DEFAULT 1;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS reg_start TIMESTAMPTZ;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS reg_end TIMESTAMPTZ;

-- 4. RLS POLICIES
ALTER TABLE public.exam_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_enrollment_read" ON public.exam_enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "student_cart_manage" ON public.cart_items FOR ALL USING (student_id = auth.uid());

-- Indexing for speed
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON public.exam_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_cart_student ON public.cart_items(student_id);
