-- ============================================================
-- BrightBoard Phase 13 — Syllabus & AI Engine Control
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. SYLLABUS NODES (UNIFIED TREE) ─────────────────────
CREATE TABLE IF NOT EXISTS syllabus_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('board', 'class', 'subject', 'chapter', 'topic', 'category')),
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  order_index INT DEFAULT 0,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. CONCEPT TAGS (AI LAYER) ───────────────────────────
CREATE TABLE IF NOT EXISTS concept_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  weightage NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. SYLLABUS VERSIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS syllabus_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  version INT NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. SYLLABUS PLANS (MONETIZATION) ─────────────────────
CREATE TABLE IF NOT EXISTS syllabus_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  pricing_type TEXT CHECK (pricing_type IN ('one-time', 'subscription')),
  price NUMERIC DEFAULT 0,
  validity_days INT DEFAULT 365,
  features JSONB DEFAULT '{"ai_mapping": true, "adaptive_learning": true, "board_comparison": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. AI ENGINE CONFIGURATION ───────────────────────────
CREATE TABLE IF NOT EXISTS ai_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. STUDENT ADAPTIVE SYLLABUS ─────────────────────────
-- Uses gen_random_uuid() as a placeholder for student_id linking later
CREATE TABLE IF NOT EXISTS student_adaptive_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID, -- usually from user_profiles
  topic_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  priority_score NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. SYLLABUS COMPARISONS ──────────────────────────────
CREATE TABLE IF NOT EXISTS syllabus_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  target_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. ROW LEVEL SECURITY (RLS) ──────────────────────────
ALTER TABLE syllabus_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_engine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_adaptive_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_comparisons ENABLE ROW LEVEL SECURITY;

-- ─── POLICIES ─────────────────────────────────────────────
-- Public Read Access for Syllabus Tree & Marketplace Plans
DROP POLICY IF EXISTS "public_read_syllabus" ON syllabus_nodes;
CREATE POLICY "public_read_syllabus" ON syllabus_nodes FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_plans" ON syllabus_plans;
CREATE POLICY "public_read_plans" ON syllabus_plans FOR SELECT USING (true);

-- Owner Full Access
CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "owner_all_syllabus_nodes" ON syllabus_nodes FOR ALL USING (is_owner());
CREATE POLICY "owner_all_concept_tags" ON concept_tags FOR ALL USING (is_owner());
CREATE POLICY "owner_all_syllabus_versions" ON syllabus_versions FOR ALL USING (is_owner());
CREATE POLICY "owner_all_syllabus_plans" ON syllabus_plans FOR ALL USING (is_owner());
CREATE POLICY "owner_all_ai_engine_config" ON ai_engine_config FOR ALL USING (is_owner());
CREATE POLICY "owner_all_syllabus_comparisons" ON syllabus_comparisons FOR ALL USING (is_owner());

-- Seed default AI settings
INSERT INTO ai_engine_config (parameter, value) VALUES
  ('auto_tagging_threshold', '0.85'),
  ('gap_detection_enabled', 'true'),
  ('adaptive_learning_modifier', '{"hard_bump": 2.0, "easy_drop": 0.5}')
ON CONFLICT (parameter) DO NOTHING;
