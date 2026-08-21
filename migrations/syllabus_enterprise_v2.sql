-- ============================================================
-- Syllabus Enterprise v2 Migration
-- Run this in your Supabase SQL Editor or via psql
-- ============================================================

-- Enable pg_trgm for fast text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Enhance syllabus_nodes ──────────────────────────────────────────────────
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'medium';
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS exam_weightage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,1);
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS color_tag VARCHAR(7);
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS sort_priority INTEGER DEFAULT 0;

-- ── Enhance syllabus_plans ──────────────────────────────────────────────────
ALTER TABLE syllabus_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE syllabus_plans ADD COLUMN IF NOT EXISTS subscribers_count INTEGER DEFAULT 0;
ALTER TABLE syllabus_plans ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12,2) DEFAULT 0;
ALTER TABLE syllabus_plans ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE syllabus_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- ── Enhance tenant_syllabus ─────────────────────────────────────────────────
ALTER TABLE tenant_syllabus ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE tenant_syllabus ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'full';
ALTER TABLE tenant_syllabus ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE tenant_syllabus ADD COLUMN IF NOT EXISTS distributed_by UUID;

-- ── New: node_questions_map (live question count per node) ──────────────────
CREATE TABLE IF NOT EXISTS node_questions_map (
    node_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
    question_count INTEGER DEFAULT 0,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (node_id)
);

-- ── New: syllabus_activity_log (full audit trail) ───────────────────────────
CREATE TABLE IF NOT EXISTS syllabus_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    actor_email TEXT,
    changes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_parent_id ON syllabus_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_type ON syllabus_nodes(type);
CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_is_active ON syllabus_nodes(is_active);
CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_order ON syllabus_nodes(order_index);
CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_name_trgm ON syllabus_nodes USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_syllabus_plans_active ON syllabus_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_syllabus_tenant ON tenant_syllabus(tenant_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_activity_log_node ON syllabus_activity_log(node_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_activity_log_created ON syllabus_activity_log(created_at DESC);

-- ── RLS policies for new tables ─────────────────────────────────────────────
ALTER TABLE node_questions_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_activity_log ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API)
CREATE POLICY IF NOT EXISTS "Service role full access node_questions_map"
    ON node_questions_map FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access syllabus_activity_log"
    ON syllabus_activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);
