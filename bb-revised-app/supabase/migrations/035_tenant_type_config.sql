-- ============================================================
-- Migration 035: Tenant Type Config Table (Owner-Controlled Rules)
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_type_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_type         TEXT UNIQUE NOT NULL
    CHECK (tenant_type IN ('school', 'institute', 'independent_teacher')),
  free_wallet_credits INTEGER NOT NULL DEFAULT 0,
  allow_sub_users     BOOLEAN NOT NULL DEFAULT TRUE,
  credit_expiry_days  INTEGER DEFAULT NULL,     -- NULL = no expiry
  first_time_only     BOOLEAN DEFAULT TRUE,     -- grant only on first enrollment
  is_active           BOOLEAN DEFAULT TRUE,
  updated_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Seed defaults matching the 3-tier model
INSERT INTO tenant_type_config (tenant_type, free_wallet_credits, allow_sub_users, first_time_only)
VALUES
  ('school',               0,   TRUE,  TRUE),
  ('institute',          500,   TRUE,  TRUE),
  ('independent_teacher', 200,  FALSE, TRUE)
ON CONFLICT (tenant_type) DO NOTHING;

ALTER TABLE tenant_type_config ENABLE ROW LEVEL SECURITY;

-- Owner: full access
CREATE POLICY "owner_manages_wallet_config"
  ON tenant_type_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Authenticated users: read only (for enrollment trigger)
CREATE POLICY "authenticated_reads_wallet_config"
  ON tenant_type_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE tenant_type_config IS
  'Owner-controlled rules for how many free wallet credits each tenant type receives on student enrollment.';
