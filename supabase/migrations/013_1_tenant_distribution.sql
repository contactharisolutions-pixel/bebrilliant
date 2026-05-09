-- ============================================================
-- BrightBoard Phase 13.1 — Tenant Syllabus Distribution
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  master_syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE tenant_syllabus ENABLE ROW LEVEL SECURITY;

-- Owner Full Access
CREATE POLICY "owner_all_tenant_subs" ON tenant_syllabus FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Tenant Read Access
CREATE POLICY "tenant_read_own_syllabus" ON tenant_syllabus FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);
