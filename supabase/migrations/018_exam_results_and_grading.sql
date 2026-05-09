-- ============================================================
-- BrightBoard Phase 7 — Exam Results & Grading Engine
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. EXTEND EXAMS SCHEMA ──────────────────────────────────────────────────
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_mode TEXT DEFAULT 'online' CHECK (exam_mode IN ('online', 'offline'));
ALTER TABLE exams ADD COLUMN IF NOT EXISTS result_published BOOLEAN DEFAULT FALSE;

-- ─── 2. EXTEND EXAM_CONFIG ────────────────────────────────────────────────────
ALTER TABLE exam_config ADD COLUMN IF NOT EXISTS passing_marks NUMERIC DEFAULT 0;
ALTER TABLE exam_config ADD COLUMN IF NOT EXISTS grading_scale JSONB DEFAULT '[
  {"grade": "A+", "min": 90, "max": 100},
  {"grade": "A", "min": 80, "max": 89},
  {"grade": "B", "min": 70, "max": 79},
  {"grade": "C", "min": 60, "max": 69},
  {"grade": "D", "min": 50, "max": 59},
  {"grade": "F", "min": 0, "max": 49}
]'::jsonb;

-- ─── 3. EXTEND EXAM_ATTEMPTS ──────────────────────────────────────────────────
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS total_marks_scored NUMERIC DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS final_grade TEXT;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS result_decided TEXT CHECK (result_decided IN ('pass', 'fail', 'none')) DEFAULT 'none';

-- ─── 4. OFFLINE MARKS UPLOAD CACHE (INTERNAL USE) ─────────────────────────────
CREATE TABLE IF NOT EXISTS offline_result_uploads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  row_data    JSONB NOT NULL, -- Raw row from Excel (student_id, question_id, marks)
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
ALTER TABLE offline_result_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_offline_results" ON offline_result_uploads;
CREATE POLICY "staff_manage_offline_results" ON offline_result_uploads FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

-- ─── 6. INDEXES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offline_results_exam ON offline_result_uploads(exam_id);
