-- ============================================================
-- Migration 034: Tenant Type Column on Tenants Table
-- ============================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tenant_type TEXT
    CHECK (tenant_type IN ('school', 'institute', 'independent_teacher'))
    DEFAULT 'institute';

-- Backfill existing tenants
UPDATE tenants SET tenant_type = 'institute' WHERE tenant_type IS NULL;

COMMENT ON COLUMN tenants.tenant_type IS
  'Determines default wallet credits, sub-user permissions, and commission behaviour.';
