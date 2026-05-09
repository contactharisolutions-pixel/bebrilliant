-- ============================================================
-- BrightBoard Phase 14.2 — Exam & Question Bank RLS & Schema Patch
-- Ensures deep configuration and templates are accessible to correct roles
-- ============================================================

-- ─── 0. MISSING COLUMNS PATCH ─────────────────────────────
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- ─── 1. EXAM CONFIGURATION SECURITY ───────────────────────
-- Inherit access from the parent exam table via EXISTS
DROP POLICY IF EXISTS "access_exam_config" ON exam_config;
CREATE POLICY "access_exam_config" ON exam_config FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_config.exam_id
  )
);

-- ─── 2. EXAM QUESTIONS SECURITY ───────────────────────────
DROP POLICY IF EXISTS "access_exam_questions" ON exam_questions;
CREATE POLICY "access_exam_questions" ON exam_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_questions.exam_id
  )
);

-- ─── 3. EXAM TEMPLATES SECURITY ───────────────────────────
DROP POLICY IF EXISTS "tenant_access_templates" ON exam_templates;
CREATE POLICY "tenant_access_templates" ON exam_templates FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  OR tenant_id IS NULL -- Global Templates
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

DROP POLICY IF EXISTS "tenant_modify_templates" ON exam_templates;
CREATE POLICY "tenant_modify_templates" ON exam_templates FOR ALL USING (
  (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner')))
  OR (tenant_id IS NULL AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'))
);

-- ─── 4. ANSWERS SECURITY ──────────────────────────────────
DROP POLICY IF EXISTS "access_answers" ON answers;
CREATE POLICY "access_answers" ON answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = answers.attempt_id
  )
);

DROP POLICY IF EXISTS "access_subjective" ON subjective_answers;
CREATE POLICY "access_subjective" ON subjective_answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = subjective_answers.attempt_id
  )
);
