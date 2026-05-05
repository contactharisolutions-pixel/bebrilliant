-- ============================================================
-- BrightBoard Phase 6 — Analytics, AI Engine & Personalization
-- Run this in the Supabase SQL Editor AFTER Phase 5
-- ============================================================

-- ─── 1. CORE ANALYTICS TABLES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sourced from Phase 5 (Future catalog tagging)
  subject_id UUID,
  chapter_id UUID,
  topic_id UUID,
  
  accuracy NUMERIC DEFAULT 0,  -- Percentage 0-100
  avg_time NUMERIC DEFAULT 0,  -- Average seconds per question response
  attempts INTEGER DEFAULT 0,  -- Total questions attempted in this topic
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, subject_id, chapter_id, topic_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  
  score NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  percentile NUMERIC,          -- Calculated asynchronously later
  predicted_rank INTEGER,      -- AI Predictive Output
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (attempt_id)
);

CREATE TABLE IF NOT EXISTS revision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  plan JSONB NOT NULL, -- structured payload specifying Day 1 -> Topics, etc.
  target_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. AI MENTOR CONTEXT LOGS (Future reference memory) ─────────────────────
CREATE TABLE IF NOT EXISTS ai_mentor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB, -- which question/topic they were looking at
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. ROW LEVEL SECURITY ───────────────────────────────────────────────────
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mentor_logs ENABLE ROW LEVEL SECURITY;

-- ─── 4. SECURITY POLICIES ────────────────────────────────────────────────────

-- Students can read their own performance Analytics & Plans
DROP POLICY IF EXISTS "student_read_performance" ON student_performance;
CREATE POLICY "student_read_performance" ON student_performance FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "student_read_results" ON exam_results;
CREATE POLICY "student_read_results" ON exam_results FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "student_read_plans" ON revision_plans;
CREATE POLICY "student_read_plans" ON revision_plans FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "student_read_ai_logs" ON ai_mentor_logs;
CREATE POLICY "student_read_ai_logs" ON ai_mentor_logs FOR SELECT USING (student_id = auth.uid());

-- Tenant Staff can read analytics for their entire tenant
DROP POLICY IF EXISTS "tenant_staff_read_analytics" ON student_performance;
CREATE POLICY "tenant_staff_read_analytics" ON student_performance FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) 
  AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

DROP POLICY IF EXISTS "tenant_staff_read_results" ON exam_results;
CREATE POLICY "tenant_staff_read_results" ON exam_results FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) 
  AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

-- ─── 5. INDEXES FOR PERFORMANCE AGGREGATION ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_performance_student ON student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_tenant ON exam_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id);
