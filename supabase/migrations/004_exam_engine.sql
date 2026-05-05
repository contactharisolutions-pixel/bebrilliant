-- ============================================================
-- BrightBoard Phase 4 — Exam & Question Bank Core Engine
-- Run this in the Supabase SQL Editor AFTER Phase 3
-- ============================================================

-- ─── 1. QUESTION BANK SYSTEM ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('objective', 'subjective')),
  sub_type TEXT CHECK (sub_type IN ('mcq', 'numerical', 'descriptive')),

  question_text JSONB NOT NULL, -- Multilingual support e.g. {"en":"...", "hi":"..."}
  options JSONB,                -- e.g. {"A":"...", "B":"..."}
  correct_answer JSONB,         -- Array or strict text depending on sub_type
  explanation JSONB,

  -- Future relation placeholders for Phase 5 Cataloging
  subject_id UUID,
  chapter_id UUID,
  topic_id UUID,

  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),

  marks NUMERIC NOT NULL DEFAULT 1,
  negative_marks NUMERIC DEFAULT 0,

  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'import')),

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. EXAMS SYSTEM ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  category_id UUID,

  is_paid BOOLEAN DEFAULT FALSE,
  price NUMERIC DEFAULT 0,

  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- in minutes
  allow_anytime BOOLEAN DEFAULT FALSE,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_config (
  exam_id UUID PRIMARY KEY REFERENCES exams(id) ON DELETE CASCADE,

  total_questions INTEGER DEFAULT 0,
  total_marks NUMERIC DEFAULT 0,

  negative_marking BOOLEAN DEFAULT FALSE,
  must_attempt INTEGER,

  randomization_mode TEXT DEFAULT 'none' CHECK (randomization_mode IN ('none', 'shuffled', 'pool', 'adaptive')),
  allow_language_switch BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS exam_questions (
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  
  section TEXT DEFAULT 'A',
  marks NUMERIC NOT NULL DEFAULT 1,

  PRIMARY KEY (exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS exam_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL means global template
  name TEXT NOT NULL,
  structure JSONB NOT NULL, -- e.g. JEE pattern defining sections/marks rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. EXAM EVALUATION & ATTEMPTS SYSTEM ────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated')),
  total_score NUMERIC
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  answer JSONB,
  is_correct BOOLEAN,
  marks_awarded NUMERIC DEFAULT 0,
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS subjective_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  answer_text TEXT,
  evaluated BOOLEAN DEFAULT FALSE,
  marks_awarded NUMERIC DEFAULT 0,
  evaluated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(attempt_id, question_id)
);

-- Randomization mapped pool per student (For strictly constrained shuffle/seed modes)
CREATE TABLE IF NOT EXISTS student_question_mapping (
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_order JSONB, -- Array tracing randomized option indices
  PRIMARY KEY (student_id, exam_id, question_id)
);

-- ─── 4. ROW LEVEL SECURITY (TENANT & ROLE ISOLATION) ─────────────────────────
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjective_answers ENABLE ROW LEVEL SECURITY;

-- ─── 5. SECURITY POLICIES ────────────────────────────────────────────────────

-- Questions & Exams: Tenant users can view questions/exams of their tenant
DROP POLICY IF EXISTS "tenant_read_questions" ON questions;
CREATE POLICY "tenant_read_questions" ON questions FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "tenant_access_exams" ON exams;
CREATE POLICY "tenant_access_exams" ON exams FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) 
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Modify Exams: Admin + Teachers (Rule: Teachers only their own, Admin all in tenant)
-- Note: Simplified rule; application layer enforces deeper RBAC using `src/lib/security.ts`
DROP POLICY IF EXISTS "tenant_modify_exams" ON exams;
CREATE POLICY "tenant_modify_exams" ON exams FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) 
  AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

-- Attempts: Students read/write their own; Teachers/Admin read their tenant's attempts
DROP POLICY IF EXISTS "student_own_attempts" ON exam_attempts;
CREATE POLICY "student_own_attempts" ON exam_attempts FOR ALL USING (
  student_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

-- Index optimization for scaling
CREATE INDEX IF NOT EXISTS idx_questions_tenant ON questions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exams_tenant ON exams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
