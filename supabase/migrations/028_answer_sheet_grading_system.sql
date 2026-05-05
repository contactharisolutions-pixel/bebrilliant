-- ============================================================
-- BrightBoard Phase 28 — Answer Sheet Auto Grading (OCR & AI)
-- ============================================================

-- 1. ANSWER SHEET UPLOADS
CREATE TABLE IF NOT EXISTS public.answer_sheet_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  total_pages INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- 2. DETECTED SUBJECTIVE ANSWERS (OCR Extracted)
CREATE TABLE IF NOT EXISTS public.answer_sheet_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES public.answer_sheet_uploads(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  detected_text TEXT, -- OCR Output
  detected_image_url TEXT, -- Cropped bounding box of the answer
  confidence NUMERIC NOT NULL, -- OCR Confidence (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(upload_id, question_id)
);

-- 3. AI & TEACHER GRADING
CREATE TABLE IF NOT EXISTS public.answer_sheet_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  auto_marks NUMERIC DEFAULT 0, -- AI Predicted marks
  teacher_marks NUMERIC, -- Manual override
  final_marks NUMERIC DEFAULT 0,
  ai_feedback TEXT, -- AI rationale for the grade
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, question_id)
);

-- 4. RLS POLICIES
ALTER TABLE public.answer_sheet_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_sheet_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_sheet_grades ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "tenant_read_answer_sheet_uploads" ON public.answer_sheet_uploads FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_answer_sheet_answers" ON public.answer_sheet_answers FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_answer_sheet_grades" ON public.answer_sheet_grades FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Management policies
CREATE POLICY "staff_manage_answer_sheet_uploads" ON public.answer_sheet_uploads FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = answer_sheet_uploads.tenant_id)
);
CREATE POLICY "staff_manage_answer_sheet_answers" ON public.answer_sheet_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = answer_sheet_answers.tenant_id)
);
CREATE POLICY "staff_manage_answer_sheet_grades" ON public.answer_sheet_grades FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = answer_sheet_grades.tenant_id)
);

-- 5. INDEXING
CREATE INDEX IF NOT EXISTS idx_answer_upload_exam ON public.answer_sheet_uploads(exam_id);
CREATE INDEX IF NOT EXISTS idx_answer_ext_upload ON public.answer_sheet_answers(upload_id);
CREATE INDEX IF NOT EXISTS idx_answer_grade_student ON public.answer_sheet_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_answer_grade_reviewed ON public.answer_sheet_grades(is_reviewed) WHERE is_reviewed = FALSE;
