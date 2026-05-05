-- ============================================================
-- BrightBoard Phase 5 — Student App & Live Proctoring
-- Run this in the Supabase SQL Editor AFTER Phase 4
-- ============================================================

-- ─── 1. PROCTORING & ANTI-CHEATING SYSTEM ────────────────────────────────────
CREATE TABLE IF NOT EXISTS proctoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  event TEXT NOT NULL,           -- e.g. "tab_switch", "visibility_hidden", "right_click", "copy_attempt"
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. ENABLE ROW LEVEL SECURITY ────────────────────────────────────────────
ALTER TABLE proctoring_logs ENABLE ROW LEVEL SECURITY;

-- ─── 3. SECURITY POLICIES ────────────────────────────────────────────────────

-- Students can insert their own proctoring logs (telemetry sent from frontend)
DROP POLICY IF EXISTS "student_insert_proctoring_logs" ON proctoring_logs;
CREATE POLICY "student_insert_proctoring_logs" ON proctoring_logs FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND student_id = auth.uid()
);

-- Teachers/Admins can read logs for exams in their tenant
DROP POLICY IF EXISTS "tenant_staff_read_proctoring_logs" ON proctoring_logs;
CREATE POLICY "tenant_staff_read_proctoring_logs" ON proctoring_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
      AND role IN ('tenant_admin', 'teacher', 'owner')
      AND (
        role = 'owner' 
        OR tenant_id = (SELECT tenant_id FROM exams WHERE id = proctoring_logs.exam_id)
      )
  )
);

-- Indexing for fast proctoring review queries
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_exam_id ON proctoring_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_student_id ON proctoring_logs(student_id);
