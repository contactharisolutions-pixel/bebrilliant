-- ============================================================
-- BrightBoard Phase 26 — OMR Offline Exam System
-- ============================================================

-- 1. OFFLINE EXAMS
CREATE TABLE IF NOT EXISTS public.offline_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL, -- Optional, if NULL applies to whole class
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  omr_template_id UUID, -- For future multi-template support
  shuffle_questions BOOLEAN DEFAULT TRUE,
  shuffle_options BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OFFLINE EXAM QUESTIONS (Master list + Shuffling mapping per student if needed)
-- Note: A simplified version stores just the questions for the exam. Student-wise shuffling can be stored here or derived.
CREATE TABLE IF NOT EXISTS public.offline_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  option_order JSONB, -- Array of indices/ids defining the option order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OMR SHEETS GENERATED
CREATE TABLE IF NOT EXISTS public.omr_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  barcode TEXT,
  pdf_url TEXT,
  shuffle_seed TEXT, -- Optional: seed used to generate student-specific question/option mapping if generated dynamically
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id),
  UNIQUE(exam_id, seat_number)
);

-- 4. OMR RESPONSES
CREATE TABLE IF NOT EXISTS public.omr_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_no INTEGER NOT NULL,
  selected_option TEXT, -- e.g., 'A', 'B', 'C', 'D' or 'MULTIPLE' or 'BLANK'
  is_correct BOOLEAN DEFAULT FALSE,
  confidence NUMERIC, -- Confidence score from OMR processing (0-100)
  marks NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id, question_no)
);

-- 5. OMR UPLOADS
CREATE TABLE IF NOT EXISTS public.omr_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_sheets INTEGER DEFAULT 0,
  failed_sheets INTEGER DEFAULT 0,
  error_log JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. OFFLINE EXAM RESULTS
CREATE TABLE IF NOT EXISTS public.offline_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  total_marks NUMERIC DEFAULT 0,
  correct INTEGER DEFAULT 0,
  wrong INTEGER DEFAULT 0,
  blank INTEGER DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- 7. RLS POLICIES
ALTER TABLE public.offline_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omr_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omr_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omr_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_exam_results ENABLE ROW LEVEL SECURITY;

-- Tenant Read Access
CREATE POLICY "tenant_read_offline_exams" ON public.offline_exams FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_offline_exam_questions" ON public.offline_exam_questions FOR SELECT USING (exam_id IN (SELECT id FROM offline_exams WHERE tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "tenant_read_omr_sheets" ON public.omr_sheets FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_omr_responses" ON public.omr_responses FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_omr_uploads" ON public.omr_uploads FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_offline_exam_results" ON public.offline_exam_results FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Staff Management Access (tenant_admin, owner, teacher)
CREATE POLICY "staff_manage_offline_exams" ON public.offline_exams FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = offline_exams.tenant_id)
);
CREATE POLICY "staff_manage_offline_exam_questions" ON public.offline_exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM offline_exams e JOIN user_profiles u ON e.tenant_id = u.tenant_id WHERE e.id = offline_exam_questions.exam_id AND u.id = auth.uid() AND u.role IN ('tenant_admin', 'owner', 'teacher'))
);
CREATE POLICY "staff_manage_omr_sheets" ON public.omr_sheets FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = omr_sheets.tenant_id)
);
CREATE POLICY "staff_manage_omr_responses" ON public.omr_responses FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = omr_responses.tenant_id)
);
CREATE POLICY "staff_manage_omr_uploads" ON public.omr_uploads FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = omr_uploads.tenant_id)
);
CREATE POLICY "staff_manage_offline_exam_results" ON public.offline_exam_results FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = offline_exam_results.tenant_id)
);

-- 8. INDEXING
CREATE INDEX IF NOT EXISTS idx_offline_exam_tenant ON public.offline_exams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offline_exam_class ON public.offline_exams(class_id);
CREATE INDEX IF NOT EXISTS idx_omr_sheets_exam ON public.omr_sheets(exam_id);
CREATE INDEX IF NOT EXISTS idx_omr_sheets_student ON public.omr_sheets(student_id);
CREATE INDEX IF NOT EXISTS idx_omr_sheets_seat ON public.omr_sheets(seat_number);
CREATE INDEX IF NOT EXISTS idx_omr_responses_exam ON public.omr_responses(exam_id);
CREATE INDEX IF NOT EXISTS idx_omr_responses_student ON public.omr_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_omr_uploads_exam ON public.omr_uploads(exam_id);
CREATE INDEX IF NOT EXISTS idx_offline_exam_results_exam ON public.offline_exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_offline_exam_results_student ON public.offline_exam_results(student_id);
