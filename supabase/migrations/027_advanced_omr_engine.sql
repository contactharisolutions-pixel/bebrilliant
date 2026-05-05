-- ============================================================
-- BrightBoard Phase 27 — Advanced OMR Engine (Barcode/QR & AI)
-- ============================================================

-- 1. OMR TEMPLATES
CREATE TABLE IF NOT EXISTS public.omr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL means global template
  name TEXT NOT NULL, -- e.g., "Standard 100 Questions", "K-12 Midterm"
  total_questions INTEGER NOT NULL,
  options_per_question INTEGER DEFAULT 4,
  layout_config JSONB, -- Coordinates for bubbles, anchors, and QR positions
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OMR BARCODES / QR CODES
CREATE TABLE IF NOT EXISTS public.omr_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.offline_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  barcode TEXT,
  qr_code TEXT NOT NULL, -- Format: exam_id|student_id|seat_number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- 3. AI DETECTION RESULTS (Confidence tracking)
CREATE TABLE IF NOT EXISTS public.omr_ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES public.omr_uploads(id) ON DELETE CASCADE,
  sheet_id UUID REFERENCES public.omr_sheets(id) ON DELETE SET NULL,
  question_no INTEGER NOT NULL,
  detected_option TEXT,
  confidence NUMERIC NOT NULL, -- 0-100
  needs_review BOOLEAN DEFAULT FALSE,
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UPDATE UPLOADS TABLE
ALTER TABLE public.omr_uploads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'bulk' CHECK (source IN ('bulk', 'mobile'));
ALTER TABLE public.omr_uploads ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.omr_templates(id);

-- 5. RLS POLICIES
ALTER TABLE public.omr_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omr_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omr_ai_results ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "tenant_read_omr_templates" ON public.omr_templates FOR SELECT USING (tenant_id IS NULL OR tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_omr_barcodes" ON public.omr_barcodes FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_read_omr_ai_results" ON public.omr_ai_results FOR SELECT USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Management policies
CREATE POLICY "staff_manage_omr_templates" ON public.omr_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner') AND (tenant_id = omr_templates.tenant_id OR omr_templates.tenant_id IS NULL))
);
CREATE POLICY "staff_manage_omr_barcodes" ON public.omr_barcodes FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = omr_barcodes.tenant_id)
);
CREATE POLICY "staff_manage_omr_ai_results" ON public.omr_ai_results FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner', 'teacher') AND tenant_id = omr_ai_results.tenant_id)
);

-- 6. INDEXING
CREATE INDEX IF NOT EXISTS idx_omr_barcode_exam ON public.omr_barcodes(exam_id);
CREATE INDEX IF NOT EXISTS idx_omr_ai_upload ON public.omr_ai_results(upload_id);
CREATE INDEX IF NOT EXISTS idx_omr_ai_review ON public.omr_ai_results(needs_review) WHERE needs_review = TRUE;
